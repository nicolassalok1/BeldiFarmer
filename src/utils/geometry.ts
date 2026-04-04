import type { LatLng } from '../types'

export function isInsidePolygon(point: LatLng, polygon: LatLng[]): boolean {
  let inside = false
  const x = point.lng, y = point.lat
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat
    const xj = polygon[j].lng, yj = polygon[j].lat
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  return inside
}

/** Spherical area using Shoelace formula (returns m²) */
export function calcArea(latlngs: LatLng[]): number {
  let area = 0
  const n = latlngs.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const lat1 = latlngs[i].lat * Math.PI / 180
    const lat2 = latlngs[j].lat * Math.PI / 180
    const lng1 = latlngs[i].lng * Math.PI / 180
    const lng2 = latlngs[j].lng * Math.PI / 180
    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2))
  }
  return Math.abs(area * 6378137 * 6378137 / 2)
}

/** Perimeter in meters using Leaflet's distanceTo */
export function calcPerimeter(latlngs: L.LatLng[]): number {
  let total = 0
  for (let i = 0; i < latlngs.length; i++) {
    total += latlngs[i].distanceTo(latlngs[(i + 1) % latlngs.length])
  }
  return total
}

export function getCentroid(polygon: LatLng[]): LatLng {
  let lat = 0, lng = 0
  polygon.forEach((p) => { lat += p.lat; lng += p.lng })
  return { lat: lat / polygon.length, lng: lng / polygon.length }
}

export function getBounds(polygon: LatLng[]) {
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity
  polygon.forEach((p) => {
    if (p.lat < minLat) minLat = p.lat
    if (p.lat > maxLat) maxLat = p.lat
    if (p.lng < minLng) minLng = p.lng
    if (p.lng > maxLng) maxLng = p.lng
  })
  return { minLat, maxLat, minLng, maxLng }
}
