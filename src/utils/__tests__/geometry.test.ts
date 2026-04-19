import { describe, it, expect } from 'vitest'
import type { LatLng } from '../../types'
import {
  isInsidePolygon,
  calcArea,
  getCentroid,
  computeConvexHull,
  computeChampOutline,
  computeChampOutlineMulti,
  getBounds,
} from '../geometry'

// A 1° × 1° square roughly centered on the equator (Atlantic, off Gabon) —
// easy numbers, no pole/antimeridian weirdness.
const unitSquare: LatLng[] = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 1 },
  { lat: 1, lng: 1 },
  { lat: 1, lng: 0 },
]

describe('isInsidePolygon', () => {
  it('returns true for a point clearly inside', () => {
    expect(isInsidePolygon({ lat: 0.5, lng: 0.5 }, unitSquare)).toBe(true)
  })

  it('returns false for a point clearly outside', () => {
    expect(isInsidePolygon({ lat: 2, lng: 2 }, unitSquare)).toBe(false)
    expect(isInsidePolygon({ lat: -1, lng: 0.5 }, unitSquare)).toBe(false)
  })

  it('handles non-convex polygons', () => {
    const cShape: LatLng[] = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 3 },
      { lat: 1, lng: 3 },
      { lat: 1, lng: 1 },
      { lat: 2, lng: 1 },
      { lat: 2, lng: 3 },
      { lat: 3, lng: 3 },
      { lat: 3, lng: 0 },
    ]
    expect(isInsidePolygon({ lat: 1.5, lng: 0.5 }, cShape)).toBe(true)
    expect(isInsidePolygon({ lat: 1.5, lng: 2 }, cShape)).toBe(false)
  })
})

describe('calcArea', () => {
  it('is proportional to latitude span — 1° × 1° near equator ≈ 12 300 km²', () => {
    const area = calcArea(unitSquare)
    expect(area).toBeGreaterThan(1.22e10)
    expect(area).toBeLessThan(1.24e10)
  })

  it('returns 0 for a degenerate (collinear) ring', () => {
    const line: LatLng[] = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
      { lat: 0, lng: 2 },
    ]
    expect(calcArea(line)).toBeCloseTo(0, 2)
  })

  it('is orientation-agnostic (absolute value)', () => {
    const cw = unitSquare
    const ccw = [...unitSquare].reverse()
    expect(calcArea(cw)).toBeCloseTo(calcArea(ccw), 5)
  })
})

describe('getCentroid', () => {
  it('returns the mean of vertices', () => {
    expect(getCentroid(unitSquare)).toEqual({ lat: 0.5, lng: 0.5 })
  })
})

describe('getBounds', () => {
  it('returns the axis-aligned bounding box', () => {
    expect(getBounds(unitSquare)).toEqual({ minLat: 0, maxLat: 1, minLng: 0, maxLng: 1 })
  })
})

describe('computeConvexHull', () => {
  it('returns fewer than N points when interior points exist', () => {
    const pts: LatLng[] = [
      ...unitSquare,
      { lat: 0.5, lng: 0.5 }, // interior
      { lat: 0.3, lng: 0.7 }, // interior
    ]
    const hull = computeConvexHull(pts)
    expect(hull.length).toBe(4)
  })

  it('returns the input when fewer than 3 points', () => {
    expect(computeConvexHull([{ lat: 0, lng: 0 }])).toHaveLength(1)
    expect(computeConvexHull([])).toHaveLength(0)
  })

  it('every hull point is from the input set', () => {
    const pts: LatLng[] = [
      { lat: 0, lng: 0 }, { lat: 2, lng: 0 }, { lat: 1, lng: 1 },
      { lat: 2, lng: 2 }, { lat: 0, lng: 2 },
    ]
    const hull = computeConvexHull(pts)
    for (const h of hull) {
      expect(pts.some((p) => p.lat === h.lat && p.lng === h.lng)).toBe(true)
    }
  })
})

describe('computeChampOutlineMulti', () => {
  it('returns [] for an empty list', () => {
    expect(computeChampOutlineMulti([])).toEqual([])
  })

  it('returns the single parcelle unchanged', () => {
    const out = computeChampOutlineMulti([unitSquare])
    expect(out).toHaveLength(1)
    expect(out[0]).toEqual(unitSquare)
  })

  it('unions two adjacent parcelles into one outline', () => {
    const left: LatLng[] = [
      { lat: 0, lng: 0 }, { lat: 0, lng: 1 },
      { lat: 1, lng: 1 }, { lat: 1, lng: 0 },
    ]
    const right: LatLng[] = [
      { lat: 0, lng: 1 }, { lat: 0, lng: 2 },
      { lat: 1, lng: 2 }, { lat: 1, lng: 1 },
    ]
    const out = computeChampOutlineMulti([left, right])
    expect(out).toHaveLength(1)
    // union covers [0,0] to [1,2] — one outline with ≥ 4 points
    expect(out[0].length).toBeGreaterThanOrEqual(4)
  })

  it('keeps two disjoint parcelles as two outlines', () => {
    const a: LatLng[] = [
      { lat: 0, lng: 0 }, { lat: 0, lng: 1 },
      { lat: 1, lng: 1 }, { lat: 1, lng: 0 },
    ]
    const b: LatLng[] = [
      { lat: 5, lng: 5 }, { lat: 5, lng: 6 },
      { lat: 6, lng: 6 }, { lat: 6, lng: 5 },
    ]
    const out = computeChampOutlineMulti([a, b])
    expect(out).toHaveLength(2)
  })
})

describe('computeChampOutline (flattened variant)', () => {
  it('flattens the multi-outline to a single point list', () => {
    const a: LatLng[] = [
      { lat: 0, lng: 0 }, { lat: 0, lng: 1 },
      { lat: 1, lng: 1 }, { lat: 1, lng: 0 },
    ]
    const flat = computeChampOutline([a])
    expect(Array.isArray(flat)).toBe(true)
    expect(flat.every((p) => typeof p.lat === 'number' && typeof p.lng === 'number')).toBe(true)
  })
})
