import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportProject, parseProjectFile } from '../exporters'
import { buildPersistedData } from '../persistence'
import type { PersistedData } from '../persistence'
import type { Field, Champ, Activity, AgendaTask } from '../../types'

function baseState() {
  return {
    exploitPolygon: [
      { lat: 0, lng: 0 }, { lat: 0, lng: 1 }, { lat: 1, lng: 1 }, { lat: 1, lng: 0 },
    ],
    exploitArea: 1.23,
    fields: [] as Field[],
    fieldIdCounter: 0,
    champs: [] as Champ[],
    champIdCounter: 0,
    generationMethod: 'grid' as const,
    density: 1,
    employees: [],
    employeeIdCounter: 0,
    strains: ['Cali Water'],
    wateringLog: [],
    wateringIdCounter: 0,
    amendmentLog: [],
    amendmentIdCounter: 0,
    soilAnalyses: [],
    soilAnalysisIdCounter: 0,
    agendaTasks: [] as AgendaTask[],
    agendaIdCounter: 0,
    activities: [] as Activity[],
    activityIdCounter: 0,
  }
}

describe('exportProject', () => {
  beforeEach(() => {
    // happy-dom doesn't implement URL.createObjectURL / revokeObjectURL
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:fake'), revokeObjectURL: vi.fn() })
  })

  it('returns false when there is nothing to export', () => {
    const empty: PersistedData = buildPersistedData({ ...baseState(), exploitPolygon: null })
    expect(exportProject(empty)).toBe(false)
  })

  it('returns true and triggers a download when data exists', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { /* noop */ })
    const data = buildPersistedData(baseState())
    expect(exportProject(data)).toBe(true)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    clickSpy.mockRestore()
  })
})

describe('parseProjectFile', () => {
  it('returns null on invalid JSON', () => {
    expect(parseProjectFile('{ not json')).toBeNull()
  })

  it('returns null on an empty project (no exploit, no fields)', () => {
    const empty = JSON.stringify({ exploitPolygon: null, fields: [] })
    expect(parseProjectFile(empty)).toBeNull()
  })

  it('parses a minimal legacy payload and applies defaults', () => {
    const legacy = JSON.stringify({
      exploitPolygon: [{ lat: 0, lng: 0 }, { lat: 0, lng: 1 }, { lat: 1, lng: 1 }],
      exploitArea: 1,
      fields: [],
    })
    const out = parseProjectFile(legacy)
    expect(out).not.toBeNull()
    expect(out!.activities).toEqual([])
    expect(out!.agendaTasks).toEqual([])
    expect(out!.champs).toEqual([])
    expect(out!.generationMethod).toBe('grid')
  })

  it('round-trips through exportProject payload and parseProjectFile', () => {
    const state = baseState()
    const data = buildPersistedData(state)
    const parsed = parseProjectFile(JSON.stringify(data))
    expect(parsed).not.toBeNull()
    expect(parsed!.strains).toEqual(['Cali Water'])
  })
})
