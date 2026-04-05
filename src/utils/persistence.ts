import type { LatLng, SamplingPoint, CultureInfo, Employee } from '../types'

const STORAGE_KEY = 'anrac-prelevements'

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
}

export function saveToStorage(data: PersistedData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage full or unavailable
  }
}

export function loadFromStorage(): PersistedData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as PersistedData
    // Backwards compat defaults
    if (!data.employees) data.employees = []
    if (!data.employeeIdCounter) data.employeeIdCounter = 0
    if (!data.strains) data.strains = []
    data.fields?.forEach((f) => {
      if (!f.assignedEmployees) f.assignedEmployees = []
      if (f.assignedManager === undefined) f.assignedManager = null
    })
    return data
  } catch {
    return null
  }
}

export function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY)
}
