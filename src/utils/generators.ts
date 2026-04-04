import type { LatLng, GenerationMethod } from '../types'
import { isInsidePolygon, getCentroid, getBounds } from './geometry'

export function generatePoints(
  polygon: LatLng[],
  method: GenerationMethod,
  targetCount: number
): LatLng[] {
  switch (method) {
    case 'grid': return generateGrid(polygon, targetCount)
    case 'zigzag': return generateZigzag(polygon, targetCount)
    case 'random': return generateRandom(polygon, targetCount)
  }
}

function generateGrid(polygon: LatLng[], count: number): LatLng[] {
  const b = getBounds(polygon)
  const aspectRatio = (b.maxLng - b.minLng) / Math.max(0.0001, b.maxLat - b.minLat)
  const cols = Math.max(1, Math.round(Math.sqrt(count * aspectRatio)))
  const rows = Math.max(1, Math.round(count / cols))
  const stepLat = (b.maxLat - b.minLat) / (rows + 1)
  const stepLng = (b.maxLng - b.minLng) / (cols + 1)
  const pts: LatLng[] = []

  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const lat = b.minLat + stepLat * r
      const lng = b.minLng + stepLng * c
      if (isInsidePolygon({ lat, lng }, polygon)) pts.push({ lat, lng })
    }
  }

  if (pts.length === 0) pts.push(getCentroid(polygon))
  return pts
}

function generateZigzag(polygon: LatLng[], count: number): LatLng[] {
  const b = getBounds(polygon)
  const rows = Math.max(2, Math.round(Math.sqrt(count)))
  const stepLat = (b.maxLat - b.minLat) / (rows + 1)
  const pts: LatLng[] = []

  for (let r = 1; r <= rows && pts.length < count; r++) {
    const lat = b.minLat + stepLat * r
    const insideLngs: number[] = []
    const scanStep = (b.maxLng - b.minLng) / 200
    for (let lng = b.minLng; lng <= b.maxLng; lng += scanStep) {
      if (isInsidePolygon({ lat, lng }, polygon)) insideLngs.push(lng)
    }
    if (!insideLngs.length) continue

    const minLng = Math.min(...insideLngs)
    const maxLng = Math.max(...insideLngs)
    const ptsPerRow = Math.max(1, Math.ceil(count / rows))

    for (let c = 0; c < ptsPerRow && pts.length < count; c++) {
      const t = ptsPerRow === 1 ? 0.5 : c / (ptsPerRow - 1)
      const lng = r % 2 === 1
        ? minLng + (maxLng - minLng) * t
        : maxLng - (maxLng - minLng) * t
      if (isInsidePolygon({ lat, lng }, polygon)) pts.push({ lat, lng })
    }
  }

  if (pts.length === 0) pts.push(getCentroid(polygon))
  return pts
}

function generateRandom(polygon: LatLng[], count: number): LatLng[] {
  const b = getBounds(polygon)
  const boundsAreaM2 =
    (b.maxLat - b.minLat) * 111320 *
    (b.maxLng - b.minLng) * 111320 * Math.cos((b.minLat + b.maxLat) / 2 * Math.PI / 180)
  const minDist = Math.sqrt(boundsAreaM2 / Math.max(1, count)) * 0.3
  const pts: LatLng[] = []
  let attempts = 0

  while (pts.length < count && attempts < count * 150) {
    attempts++
    const lat = b.minLat + Math.random() * (b.maxLat - b.minLat)
    const lng = b.minLng + Math.random() * (b.maxLng - b.minLng)
    if (!isInsidePolygon({ lat, lng }, polygon)) continue

    const tooClose = pts.some((p) => {
      const dlat = (p.lat - lat) * 111320
      const dlng = (p.lng - lng) * 111320 * Math.cos(lat * Math.PI / 180)
      return Math.sqrt(dlat * dlat + dlng * dlng) < minDist
    })
    if (!tooClose) pts.push({ lat, lng })
  }

  if (pts.length === 0) pts.push(getCentroid(polygon))
  return pts
}
