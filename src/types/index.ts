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
  strain: string
}

// ── Personnel ──

export interface Employee {
  id: number
  name: string
  role: 'employe' | 'responsable'
  phone?: string
}

// ── Arrosage ──

export type IrrigationMethod = 'goutte_a_goutte' | 'aspersion' | 'gravitaire' | 'manuel'

export interface WateringEntry {
  id: number
  date: string          // ISO date
  fieldId: number
  method: IrrigationMethod
  durationMin: number   // durée en minutes
  volumeL?: number      // volume en litres (optionnel)
  notes?: string
}

// ── Amendements / Engrais ──

export type AmendmentType = 'organique' | 'mineral' | 'foliaire' | 'correcteur'

export interface AmendmentEntry {
  id: number
  date: string
  fieldId: number
  type: AmendmentType
  product: string       // nom du produit
  quantityKg: number    // quantité en kg
  notes?: string
}

// ── Analyse des sols ──

export interface SoilAnalysis {
  id: number
  date: string
  fieldId: number
  ph: number
  nitrogen: number      // N en mg/kg
  phosphorus: number    // P en mg/kg
  potassium: number     // K en mg/kg
  organicMatter: number // % matière organique
  texture?: string      // ex: "argilo-limoneux"
  notes?: string
}

// ── Relief / Exposition ──

export type Exposition = 'nord' | 'nord-est' | 'est' | 'sud-est' | 'sud' | 'sud-ouest' | 'ouest' | 'nord-ouest' | 'plat'

export interface ReliefInfo {
  altitudeMin?: number   // mètres
  altitudeMax?: number
  slope?: number         // pente en %
  exposition: Exposition
  sunlightHours?: number // heures d'ensoleillement moyen / jour
}

// ── Fields ──

export interface Field {
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
  // Leaflet layers (runtime only)
  layer?: L.Polygon
  labelMarker?: L.Marker
  pointMarkers: L.Marker[]
}

export type DrawTarget = 'exploit' | 'field' | null
export type GenerationMethod = 'grid' | 'zigzag' | 'random'

export type DashboardTab = 'overview' | 'cultures' | 'personnel' | 'watering' | 'amendments' | 'soil' | 'relief'
export type FieldDetailTab = 'info' | 'culture' | 'personnel' | 'watering' | 'amendments' | 'soil' | 'relief'

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

  // History logs
  wateringLog: WateringEntry[]
  wateringIdCounter: number
  amendmentLog: AmendmentEntry[]
  amendmentIdCounter: number
  soilAnalyses: SoilAnalysis[]
  soilAnalysisIdCounter: number

  // UI
  currentStep: number
  toastMessage: string | null
  toastError: boolean
  statusText: string
  helpOpen: boolean
  dashboardOpen: boolean
  dashboardTab: DashboardTab
  fieldDetailOpen: boolean
  fieldDetailTab: FieldDetailTab

  // ── Actions ──

  // Exploitation
  setExploitation: (polygon: LatLng[], area: number, layer: L.Polygon, label: L.Marker) => void
  clearExploitation: () => void

  // Fields
  addField: (field: Field) => void
  removeField: (id: number) => void
  selectField: (id: number | null) => void
  updateField: (id: number, updates: Partial<Pick<Field, 'name' | 'culture' | 'assignedEmployees' | 'assignedManager' | 'relief'>>) => void
  setFieldPoints: (fieldId: number, points: SamplingPoint[], markers: L.Marker[]) => void
  removePoint: (fieldId: number, pointIndex: number) => void

  // Drawing
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

  // Watering
  addWatering: (entry: Omit<WateringEntry, 'id'>) => void
  removeWatering: (id: number) => void

  // Amendments
  addAmendment: (entry: Omit<AmendmentEntry, 'id'>) => void
  removeAmendment: (id: number) => void

  // Soil
  addSoilAnalysis: (entry: Omit<SoilAnalysis, 'id'>) => void
  removeSoilAnalysis: (id: number) => void

  // UI
  toast: (message: string, error?: boolean) => void
  clearToast: () => void
  setStatus: (text: string) => void
  setHelpOpen: (open: boolean) => void
  setDashboardOpen: (open: boolean) => void
  setDashboardTab: (tab: DashboardTab) => void
  openFieldDetail: (fieldId: number, tab?: FieldDetailTab) => void
  closeFieldDetail: () => void
  setFieldDetailTab: (tab: FieldDetailTab) => void
  clearAll: () => void
}
