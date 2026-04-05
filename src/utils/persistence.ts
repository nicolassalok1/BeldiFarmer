import type { LatLng, SamplingPoint } from '../types'

const STORAGE_KEY = 'anrac-prelevements'

export interface PersistedField {
  id: number
  name: string
  color: string
  latlngs: LatLng[]
  area: number
  perimeter: number
  points: SamplingPoint[]
}

export interface PersistedData {
  exploitPolygon: LatLng[] | null
  exploitArea: number
  fields: PersistedField[]
  fieldIdCounter: number
  generationMethod: string
  density: number
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
    return JSON.parse(raw) as PersistedData
  } catch {
    return null
  }
}

export function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY)
}
