import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Local dev replica of the Vercel serverless function at /api/elevation.
 * Keeps the client-server contract identical whether we run `vite dev`
 * locally or the deployed app on Vercel — the client always calls
 * /api/elevation same-origin and never touches an external host directly.
 */
function elevationProxyPlugin(): Plugin {
  return {
    name: 'elevation-proxy',
    configureServer(server) {
      server.middlewares.use('/api/elevation', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Method not allowed' })
          return
        }
        let raw = ''
        req.setEncoding('utf8')
        req.on('data', (chunk) => { raw += chunk })
        req.on('end', async () => {
          let body: { locations?: unknown }
          try {
            body = JSON.parse(raw)
          } catch {
            sendJson(res, 400, { error: 'Invalid JSON body' })
            return
          }
          const locations = sanitizeLocations(body.locations)
          if (!locations) {
            sendJson(res, 400, { error: 'locations must be a non-empty array of {lat, lng}' })
            return
          }
          if (locations.length > 100) {
            sendJson(res, 400, { error: 'max 100 locations per request' })
            return
          }

          // Ordered fallback chain — same as the Vercel serverless function.
          const upstreams: Array<{ name: string; fetch: (locs: LatLng[]) => Promise<number[]> }> = [
            { name: 'open-elevation', fetch: fetchFromOpenElevation },
            { name: 'opentopodata', fetch: fetchFromOpenTopoData },
            { name: 'open-meteo', fetch: fetchFromOpenMeteo },
          ]
          const failures: string[] = []
          for (const upstream of upstreams) {
            try {
              const elevations = await upstream.fetch(locations)
              if (elevations.length !== locations.length) {
                failures.push(`${upstream.name}: length mismatch`)
                continue
              }
              sendJson(res, 200, { elevations, source: upstream.name })
              return
            } catch (e) {
              failures.push(`${upstream.name}: ${e instanceof Error ? e.message : 'unknown'}`)
            }
          }
          sendJson(res, 502, { error: 'all upstream elevation providers failed', failures })
        })
      })
    },
  }
}

async function fetchFromOpenElevation(locations: LatLng[]): Promise<number[]> {
  const resp = await fetch('https://api.open-elevation.com/api/v1/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      locations: locations.map((p) => ({ latitude: p.lat, longitude: p.lng })),
    }),
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const data = (await resp.json()) as { results?: Array<{ elevation?: number | null }> }
  if (!Array.isArray(data.results)) throw new Error('missing results')
  return data.results.map((r) => (typeof r.elevation === 'number' ? r.elevation : 0))
}

async function fetchFromOpenTopoData(locations: LatLng[]): Promise<number[]> {
  const pipe = locations.map((p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join('|')
  const resp = await fetch(`https://api.opentopodata.org/v1/srtm30m?locations=${pipe}`)
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const data = (await resp.json()) as { results?: Array<{ elevation?: number | null }>; status?: string }
  if (data.status && data.status !== 'OK') throw new Error(data.status)
  if (!Array.isArray(data.results)) throw new Error('missing results')
  return data.results.map((r) => (typeof r.elevation === 'number' ? r.elevation : 0))
}

async function fetchFromOpenMeteo(locations: LatLng[]): Promise<number[]> {
  const lats = locations.map((p) => p.lat.toFixed(6)).join(',')
  const lngs = locations.map((p) => p.lng.toFixed(6)).join(',')
  const resp = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`)
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const data = (await resp.json()) as { elevation?: number[] }
  if (!Array.isArray(data.elevation)) throw new Error('missing elevation array')
  return data.elevation
}

interface LatLng { lat: number; lng: number }

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

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export default defineConfig({
  plugins: [react(), tailwindcss(), elevationProxyPlugin()],
})
