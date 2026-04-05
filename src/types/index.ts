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

// ── Cultures ──

export type SeedType = 'beldia' | 'cali'

export interface CultureInfo {
  seedType: SeedType
  strain: string // only used when seedType === 'cali'
}

// ── Personnel ──

export interface Employee {
  id: number
  name: string
  role: 'employe' | 'responsable'
  phone?: string
}

// ── Fields ──

export interface Field {
  id: number
  name: string
  color: string
  latlngs: LatLng[]
  area: number      // hectares
  perimeter: number  // meters
  points: SamplingPoint[]
  culture?: CultureInfo
  assignedEmployees: number[]   // employee IDs
  assignedManager: number | null // employee ID with role 'responsable'
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

  // Personnel
  employees: Employee[]
  employeeIdCounter: number

  // Strains catalog
  strains: string[]

  // UI
  currentStep: number
  toastMessage: string | null
  toastError: boolean
  statusText: string
  helpOpen: boolean
  dashboardOpen: boolean
  dashboardTab: 'params' | 'personnel' | 'cultures'

  // Actions
  setExploitation: (polygon: LatLng[], area: number, layer: L.Polygon, label: L.Marker) => void
  clearExploitation: () => void
  addField: (field: Field) => void
  removeField: (id: number) => void
  selectField: (id: number | null) => void
  updateField: (id: number, updates: Partial<Pick<Field, 'culture' | 'assignedEmployees' | 'assignedManager'>>) => void
  setFieldPoints: (fieldId: number, points: SamplingPoint[], markers: L.Marker[]) => void
  removePoint: (fieldId: number, pointIndex: number) => void
  setDrawTarget: (target: DrawTarget) => void
  setGenerationMethod: (method: GenerationMethod) => void
  setDensity: (density: number) => void
  // Personnel
  addEmployee: (emp: Omit<Employee, 'id'>) => void
  updateEmployee: (id: number, updates: Partial<Omit<Employee, 'id'>>) => void
  removeEmployee: (id: number) => void
  // Strains
  addStrain: (strain: string) => void
  removeStrain: (strain: string) => void
  // UI
  toast: (message: string, error?: boolean) => void
  clearToast: () => void
  setStatus: (text: string) => void
  setHelpOpen: (open: boolean) => void
  setDashboardOpen: (open: boolean) => void
  setDashboardTab: (tab: 'params' | 'personnel' | 'cultures') => void
  clearAll: () => void
}
