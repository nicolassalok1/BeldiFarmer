import type L from 'leaflet'

export interface LatLng {
  lat: number
  lng: number
}

export interface SamplingPoint {
  label: string
  lat: number
  lng: number
}

export interface Field {
  id: number
  name: string
  color: string
  latlngs: LatLng[]
  area: number      // hectares
  perimeter: number  // meters
  points: SamplingPoint[]
  // Leaflet layers (set at runtime, not serializable)
  layer?: L.Polygon
  labelMarker?: L.Marker
  pointMarkers: L.Marker[]
}

export type DrawTarget = 'exploit' | 'field' | null

export type GenerationMethod = 'grid' | 'zigzag' | 'random'

export interface AppState {
  // Exploitation
  exploitPolygon: LatLng[] | null
  exploitArea: number
  exploitLayer: L.Polygon | null
  exploitLabel: L.Marker | null

  // Fields
  fields: Field[]
  fieldIdCounter: number
  selectedFieldId: number | null

  // Drawing
  drawTarget: DrawTarget

  // Generation config
  generationMethod: GenerationMethod
  density: number

  // UI
  currentStep: number
  toastMessage: string | null
  toastError: boolean
  statusText: string
  helpOpen: boolean

  // Actions
  setExploitation: (polygon: LatLng[], area: number, layer: L.Polygon, label: L.Marker) => void
  clearExploitation: () => void
  addField: (field: Field) => void
  removeField: (id: number) => void
  selectField: (id: number | null) => void
  setFieldPoints: (fieldId: number, points: SamplingPoint[], markers: L.Marker[]) => void
  removePoint: (fieldId: number, pointIndex: number) => void
  setDrawTarget: (target: DrawTarget) => void
  setGenerationMethod: (method: GenerationMethod) => void
  setDensity: (density: number) => void
  toast: (message: string, error?: boolean) => void
  clearToast: () => void
  setStatus: (text: string) => void
  setHelpOpen: (open: boolean) => void
  clearAll: () => void
}
