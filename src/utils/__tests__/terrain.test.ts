import { describe, it, expect } from 'vitest'
import type { LatLng } from '../../types'
import {
  sampleFieldPoints,
  toLocalMeters,
  fitPlane,
  computeReliefStats,
  bearingToExposition,
  type ReliefSample,
} from '../terrain'
import { isInsidePolygon } from '../geometry'

const square: LatLng[] = [
  { lat: 44.0, lng: 5.0 },
  { lat: 44.0, lng: 5.01 },
  { lat: 44.01, lng: 5.01 },
  { lat: 44.01, lng: 5.0 },
]

describe('sampleFieldPoints', () => {
  it('returns the polygon vertices + interior samples', () => {
    const pts = sampleFieldPoints(square, 12)
    expect(pts.length).toBeGreaterThanOrEqual(12)
    for (const v of square) {
      expect(pts.some((p) => p.lat === v.lat && p.lng === v.lng)).toBe(true)
    }
  })

  it('all interior samples lie inside the polygon', () => {
    const pts = sampleFieldPoints(square, 20)
    // first N pts are vertices, rest are interior
    const interior = pts.slice(square.length)
    for (const p of interior) {
      expect(isInsidePolygon(p, square)).toBe(true)
    }
  })

  it('caps the total at 100', () => {
    const pts = sampleFieldPoints(square, 500)
    expect(pts.length).toBeLessThanOrEqual(100)
  })

  it('returns the ring itself when fewer than 3 points', () => {
    expect(sampleFieldPoints([{ lat: 0, lng: 0 }], 10)).toEqual([{ lat: 0, lng: 0 }])
    expect(sampleFieldPoints([], 10)).toEqual([])
  })
})

describe('toLocalMeters', () => {
  it('projects the reference point to (0,0)', () => {
    const ref = { lat: 44, lng: 5 }
    expect(toLocalMeters(ref, ref)).toEqual({ x: 0, y: 0 })
  })

  it('has positive x for a point east of the reference', () => {
    const ref = { lat: 44, lng: 5 }
    const east = { lat: 44, lng: 5.01 }
    const { x, y } = toLocalMeters(ref, east)
    expect(x).toBeGreaterThan(0)
    expect(Math.abs(y)).toBeLessThan(1) // same latitude
  })

  it('has positive y for a point north of the reference', () => {
    const ref = { lat: 44, lng: 5 }
    const north = { lat: 44.01, lng: 5 }
    const { x, y } = toLocalMeters(ref, north)
    expect(y).toBeGreaterThan(0)
    expect(Math.abs(x)).toBeLessThan(1) // same longitude
  })
})

describe('fitPlane', () => {
  it('returns null for fewer than 3 samples', () => {
    expect(fitPlane([])).toBeNull()
    expect(fitPlane([{ x: 0, y: 0, z: 1 }])).toBeNull()
  })

  it('recovers known plane coefficients exactly (z = 2x + 3y + 5)', () => {
    const pts = [
      { x: 0, y: 0, z: 5 },
      { x: 1, y: 0, z: 7 },
      { x: 0, y: 1, z: 8 },
      { x: 1, y: 1, z: 10 },
      { x: 2, y: 2, z: 15 },
    ]
    const plane = fitPlane(pts)
    expect(plane).not.toBeNull()
    expect(plane!.a).toBeCloseTo(2, 6)
    expect(plane!.b).toBeCloseTo(3, 6)
    expect(plane!.c).toBeCloseTo(5, 6)
  })

  it('returns null for collinear (degenerate) samples', () => {
    const pts = [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 1 },
      { x: 2, y: 0, z: 2 },
    ]
    expect(fitPlane(pts)).toBeNull()
  })
})

describe('computeReliefStats', () => {
  it('returns zeros for empty input', () => {
    const s = computeReliefStats([])
    expect(s).toEqual({ altMin: 0, altMax: 0, altMean: 0, slopePct: 0, aspectDeg: null, sampleCount: 0 })
  })

  it('reports flat aspect on a horizontal field', () => {
    const samples: ReliefSample[] = [
      { lat: 44, lng: 5, altitude: 100 },
      { lat: 44, lng: 5.001, altitude: 100 },
      { lat: 44.001, lng: 5, altitude: 100 },
      { lat: 44.001, lng: 5.001, altitude: 100 },
    ]
    const s = computeReliefStats(samples)
    expect(s.altMin).toBe(100)
    expect(s.altMax).toBe(100)
    expect(s.slopePct).toBeCloseTo(0, 5)
    expect(s.aspectDeg).toBeNull()
  })

  it('detects a south-facing slope (altitude increases northward)', () => {
    // Aspect = direction the slope FACES (downhill). If altitude grows going
    // north, moving south is going downhill → slope faces south (~180°).
    const samples: ReliefSample[] = [
      { lat: 44.000, lng: 5, altitude: 80 },
      { lat: 44.001, lng: 5, altitude: 90 },
      { lat: 44.002, lng: 5, altitude: 100 },
      { lat: 44.001, lng: 5.001, altitude: 90 },
    ]
    const s = computeReliefStats(samples)
    expect(s.slopePct).toBeGreaterThan(2)
    expect(s.aspectDeg).not.toBeNull()
    expect(s.aspectDeg!).toBeGreaterThan(150)
    expect(s.aspectDeg!).toBeLessThan(210)
  })

  it('detects a north-facing slope (altitude decreases northward)', () => {
    const samples: ReliefSample[] = [
      { lat: 44.000, lng: 5, altitude: 100 },
      { lat: 44.001, lng: 5, altitude: 90 },
      { lat: 44.002, lng: 5, altitude: 80 },
      { lat: 44.001, lng: 5.001, altitude: 90 },
    ]
    const s = computeReliefStats(samples)
    expect(s.slopePct).toBeGreaterThan(2)
    expect(s.aspectDeg).not.toBeNull()
    // aspect ≈ 0° (or equivalently ~360°)
    const deg = s.aspectDeg!
    expect(deg < 30 || deg > 330).toBe(true)
  })
})

describe('bearingToExposition', () => {
  it.each([
    [null, 10, 'plat'],
    [90, 0, 'plat'],
    [90, 1.5, 'plat'],
    [0, 5, 'nord'],
    [45, 5, 'nord-est'],
    [90, 5, 'est'],
    [135, 5, 'sud-est'],
    [180, 5, 'sud'],
    [225, 5, 'sud-ouest'],
    [270, 5, 'ouest'],
    [315, 5, 'nord-ouest'],
    [360, 5, 'nord'],
    [359, 5, 'nord'],
  ])('deg=%s, slope=%s%% → %s', (deg, slope, expected) => {
    expect(bearingToExposition(deg, slope)).toBe(expected)
  })
})
