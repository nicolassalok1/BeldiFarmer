import { describe, it, expect } from 'vitest'
import type { LatLng } from '../../types'
import { generatePoints } from '../generators'
import { isInsidePolygon } from '../geometry'

const square: LatLng[] = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 1 },
  { lat: 1, lng: 1 },
  { lat: 1, lng: 0 },
]

describe('generatePoints', () => {
  it.each(['grid', 'zigzag', 'random'] as const)('returns points inside the polygon (%s)', (method) => {
    const pts = generatePoints(square, method, 10)
    expect(pts.length).toBeGreaterThan(0)
    for (const p of pts) {
      expect(isInsidePolygon(p, square)).toBe(true)
    }
  })

  it.each(['grid', 'zigzag', 'random'] as const)('falls back to centroid when count=0 and polygon is valid (%s)', (method) => {
    const pts = generatePoints(square, method, 0)
    // grid/zigzag/random all guarantee ≥ 1 point (centroid fallback)
    expect(pts.length).toBeGreaterThanOrEqual(1)
  })

  it('grid: target 16 points inside unit square produces something close to that', () => {
    const pts = generatePoints(square, 'grid', 16)
    expect(pts.length).toBeGreaterThanOrEqual(8)
    expect(pts.length).toBeLessThanOrEqual(20)
  })

  it('random: produces variable output across calls', () => {
    const a = generatePoints(square, 'random', 20).map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`)
    const b = generatePoints(square, 'random', 20).map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`)
    // With random, we expect at least one disagreement across 40 coords (~0% false-pos probability)
    expect(a.join('|') === b.join('|')).toBe(false)
  })

  it('zigzag: honours the count cap', () => {
    const pts = generatePoints(square, 'zigzag', 5)
    expect(pts.length).toBeLessThanOrEqual(5)
  })
})
