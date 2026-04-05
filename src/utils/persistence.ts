import type { LatLng, SamplingPoint, CultureInfo, Employee, WateringEntry, AmendmentEntry, SoilAnalysis, ReliefInfo } from '../types'

const STORAGE_KEY = 'anrac-prelevements-v2'

export interface PersistedField {
  id: number
  name: string
  color: string
  latlngs: LatLng[]
  area: number
  perimeter: number
  points: SamplingPoint[]
  culture?: CultureInfo
  assignedEmployees: number[]
  assignedManager: number | null
  relief?: ReliefInfo
}

export interface PersistedData {
  exploitPolygon: LatLng[] | null
  exploitArea: number
  fields: PersistedField[]
  fieldIdCounter: number
  generationMethod: string
  density: number
  employees: Employee[]
  employeeIdCounter: number
  strains: string[]
  wateringLog: WateringEntry[]
  wateringIdCounter: number
  amendmentLog: AmendmentEntry[]
  amendmentIdCounter: number
  soilAnalyses: SoilAnalysis[]
  soilAnalysisIdCounter: number
}

export function saveToStorage(data: PersistedData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* full */ }
}

export function loadFromStorage(): PersistedData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as PersistedData
    // Backwards compat
    data.employees ??= []
    data.employeeIdCounter ??= 0
    data.strains ??= []
    data.wateringLog ??= []
    data.wateringIdCounter ??= 0
    data.amendmentLog ??= []
    data.amendmentIdCounter ??= 0
    data.soilAnalyses ??= []
    data.soilAnalysisIdCounter ??= 0
    data.fields?.forEach((f) => {
      f.assignedEmployees ??= []
      f.assignedManager ??= null
    })
    return data
  } catch {
    return null
  }
}

export function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY)
}
