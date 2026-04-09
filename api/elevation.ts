/**
 * Vercel serverless function — elevation proxy.
 *
 * Runs server-side so that:
 *   1. The browser calls only our own origin (/api/elevation) → no CORS issues
 *      regardless of the upstream provider's headers.
 *   2. The outbound IP is the Vercel function's, not the user's — avoids
 *      the IP bans we were getting on Open-Meteo's free tier.
 *   3. We can edge-cache responses (SRTM never changes).
 *
 * Contract:
 *   POST /api/elevation
 *   Body: { "locations": [{ "lat": <num>, "lng": <num> }, …] }  (max 100)
 *   200:  { "elevations": [<num>, …] }   (same length as locations)
 *   400:  { "error": "<reason>" }
 *   502:  { "error": "<upstream failure>" }
 */

interface LatLng { lat: number; lng: number }
interface ElevationBody { locations?: unknown }

const MAX_LOCATIONS = 100

/**
 * Ordered fallback chain of elevation upstreams. All deliver SRTM 30m GL1,
 * just from different hosting infrastructures — if one is rate-limited or
 * down, the next picks up.
 *
 *   1. Open-Elevation   — community service, no docs rate limit, POST JSON
 *   2. OpenTopoData     — Cloudflare-backed, strict 1 req/s, GET pipe
 *   3. Open-Meteo       — strict per-IP burst limiter, last resort
 */
const UPSTREAMS: Array<{
  name: string
  fetch: (locs: LatLng[]) => Promise<number[]>
}> = [
  { name: 'open-elevation', fetch: fetchFromOpenElevation },
  { name: 'opentopodata', fetch: fetchFromOpenTopoData },
  { name: 'open-meteo', fetch: fetchFromOpenMeteo },
]

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  let body: ElevationBody
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const locations = sanitizeLocations(body.locations)
  if (!locations) {
    return json({ error: 'locations must be a non-empty array of {lat, lng}' }, 400)
  }
  if (locations.length > MAX_LOCATIONS) {
    return json({ error: `max ${MAX_LOCATIONS} locations per request` }, 400)
  }

  // Try each upstream in order. Collect failures for diagnostics.
  const failures: string[] = []
  for (const upstream of UPSTREAMS) {
    try {
      const elevations = await upstream.fetch(locations)
      if (elevations.length !== locations.length) {
        failures.push(`${upstream.name}: length mismatch`)
        continue
      }
      return new Response(JSON.stringify({ elevations, source: upstream.name }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // SRTM is static — cache aggressively at the Vercel edge.
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        },
      })
    } catch (e) {
      failures.push(`${upstream.name}: ${e instanceof Error ? e.message : 'unknown'}`)
    }
  }

  return json(
    { error: 'all upstream elevation providers failed', failures },
    502,
  )
}

// ── Upstream adapters ────────────────────────────────────────────────

async function fetchFromOpenElevation(locations: LatLng[]): Promise<number[]> {
  const resp = await fetch('https://api.open-elevation.com/api/v1/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      locations: locations.map((p) => ({ latitude: p.lat, longitude: p.lng })),
    }),
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const data = (await resp.json()) as {
    results?: Array<{ elevation?: number | null }>
  }
  if (!Array.isArray(data.results)) throw new Error('missing results')
  return data.results.map((r) => (typeof r.elevation === 'number' ? r.elevation : 0))
}

async function fetchFromOpenTopoData(locations: LatLng[]): Promise<number[]> {
  const pipe = locations
    .map((p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`)
    .join('|')
  const resp = await fetch(
    `https://api.opentopodata.org/v1/srtm30m?locations=${pipe}`,
  )
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const data = (await resp.json()) as {
    results?: Array<{ elevation?: number | null }>
    status?: string
  }
  if (data.status && data.status !== 'OK') throw new Error(data.status)
  if (!Array.isArray(data.results)) throw new Error('missing results')
  return data.results.map((r) => (typeof r.elevation === 'number' ? r.elevation : 0))
}

async function fetchFromOpenMeteo(locations: LatLng[]): Promise<number[]> {
  const lats = locations.map((p) => p.lat.toFixed(6)).join(',')
  const lngs = locations.map((p) => p.lng.toFixed(6)).join(',')
  const resp = await fetch(
    `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`,
  )
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const data = (await resp.json()) as { elevation?: number[] }
  if (!Array.isArray(data.elevation)) throw new Error('missing elevation array')
  return data.elevation
}

function sanitizeLocations(input: unknown): LatLng[] | null {
  if (!Array.isArray(input) || input.length === 0) return null
  const out: LatLng[] = []
  for (const item of input) {
    if (!item || typeof item !== 'object') return null
    const lat = (item as Record<string, unknown>).lat
    const lng = (item as Record<string, unknown>).lng
    if (typeof lat !== 'number' || typeof lng !== 'number') return null
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
    out.push({ lat, lng })
  }
  return out
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
