import { create } from 'zustand'
import type { AppState } from '../types'
import { saveToStorage } from '../utils/persistence'

export const FIELD_COLORS = [
  '#8fa84f', '#e6a817', '#a84f6a', '#4f6aa8', '#a8854f',
  '#8a4fa8', '#4fa85e', '#cf4a4a', '#4a8fcf', '#cfcf4a',
]

function persist(state: AppState) {
  saveToStorage({
    exploitPolygon: state.exploitPolygon,
    exploitArea: state.exploitArea,
    fields: state.fields.map((f) => ({
      id: f.id, name: f.name, color: f.color, latlngs: f.latlngs,
      area: f.area, perimeter: f.perimeter, points: f.points,
      culture: f.culture, assignedEmployees: f.assignedEmployees,
      assignedManager: f.assignedManager, relief: f.relief,
    })),
    fieldIdCounter: state.fieldIdCounter,
    generationMethod: state.generationMethod,
    density: state.density,
    employees: state.employees,
    employeeIdCounter: state.employeeIdCounter,
    strains: state.strains,
    wateringLog: state.wateringLog,
    wateringIdCounter: state.wateringIdCounter,
    amendmentLog: state.amendmentLog,
    amendmentIdCounter: state.amendmentIdCounter,
    soilAnalyses: state.soilAnalyses,
    soilAnalysisIdCounter: state.soilAnalysisIdCounter,
  })
}

export const useAppStore = create<AppState>((set, get) => ({
  exploitPolygon: null, exploitArea: 0, exploitLayer: null, exploitLabel: null,
  fields: [], fieldIdCounter: 0, selectedFieldId: null,
  drawTarget: null, editTarget: null, generationMethod: 'grid', density: 1,
  employees: [], employeeIdCounter: 0, strains: [],
  wateringLog: [], wateringIdCounter: 0,
  amendmentLog: [], amendmentIdCounter: 0,
  soilAnalyses: [], soilAnalysisIdCounter: 0,
  currentStep: 1, toastMessage: null, toastError: false,
  statusText: 'EN ATTENTE', helpOpen: false, dashboardOpen: false, dashboardTab: 'overview',
  fieldDetailOpen: false, fieldDetailTab: 'info',

  // ── Exploitation ──
  setExploitation: (polygon, area, layer, label) => {
    set({ exploitPolygon: polygon, exploitArea: area, exploitLayer: layer, exploitLabel: label, currentStep: 2 })
    persist(get())
  },
  clearExploitation: () => {
    set({ exploitPolygon: null, exploitArea: 0, exploitLayer: null, exploitLabel: null, fields: [], fieldIdCounter: 0, selectedFieldId: null, currentStep: 1 })
    persist(get())
  },

  // ── Fields ──
  addField: (field) => {
    set((s) => ({ fields: [...s.fields, field], fieldIdCounter: field.id, selectedFieldId: field.id, currentStep: 3 }))
    persist(get())
  },
  removeField: (id) => {
    set((s) => {
      const remaining = s.fields.filter((f) => f.id !== id)
      return { fields: remaining, selectedFieldId: s.selectedFieldId === id ? (remaining[0]?.id ?? null) : s.selectedFieldId, currentStep: remaining.length === 0 ? 2 : 3 }
    })
    persist(get())
  },
  selectField: (id) => set({ selectedFieldId: id }),
  updateField: (id, updates) => {
    set((s) => ({ fields: s.fields.map((f) => f.id === id ? { ...f, ...updates } : f) }))
    persist(get())
  },
  setFieldPoints: (fieldId, points, markers) => {
    set((s) => ({ fields: s.fields.map((f) => f.id === fieldId ? { ...f, points, pointMarkers: markers } : f) }))
    persist(get())
  },
  removePoint: (fieldId, pointIndex) => {
    set((s) => ({
      fields: s.fields.map((f) => {
        if (f.id !== fieldId) return f
        const newPoints = [...f.points]; newPoints.splice(pointIndex, 1)
        const newMarkers = [...f.pointMarkers]; newMarkers.splice(pointIndex, 1)
        return { ...f, points: newPoints, pointMarkers: newMarkers }
      }),
    }))
    persist(get())
  },

  // ── Drawing / Config ──
  setDrawTarget: (target) => set({ drawTarget: target }),
  setEditTarget: (target) => set({ editTarget: target }),
  updateExploitPolygon: (polygon, area) => {
    set({ exploitPolygon: polygon, exploitArea: area })
    persist(get())
  },
  updateFieldPolygon: (fieldId, latlngs, area, perimeter) => {
    set((s) => ({ fields: s.fields.map((f) => f.id === fieldId ? { ...f, latlngs, area, perimeter } : f) }))
    persist(get())
  },
  setGenerationMethod: (method) => { set({ generationMethod: method }); persist(get()) },
  setDensity: (density) => { set({ density }); persist(get()) },

  // ── Personnel ──
  addEmployee: (emp) => {
    set((s) => ({ employees: [...s.employees, { ...emp, id: s.employeeIdCounter + 1 }], employeeIdCounter: s.employeeIdCounter + 1 }))
    persist(get())
  },
  updateEmployee: (id, updates) => {
    set((s) => ({ employees: s.employees.map((e) => e.id === id ? { ...e, ...updates } : e) }))
    persist(get())
  },
  removeEmployee: (id) => {
    set((s) => ({
      employees: s.employees.filter((e) => e.id !== id),
      fields: s.fields.map((f) => ({
        ...f, assignedEmployees: f.assignedEmployees.filter((eid) => eid !== id),
        assignedManager: f.assignedManager === id ? null : f.assignedManager,
      })),
    }))
    persist(get())
  },

  // ── Strains ──
  addStrain: (strain) => { set((s) => ({ strains: s.strains.includes(strain) ? s.strains : [...s.strains, strain] })); persist(get()) },
  removeStrain: (strain) => { set((s) => ({ strains: s.strains.filter((st) => st !== strain) })); persist(get()) },

  // ── Watering ──
  addWatering: (entry) => {
    set((s) => ({ wateringLog: [...s.wateringLog, { ...entry, id: s.wateringIdCounter + 1 }], wateringIdCounter: s.wateringIdCounter + 1 }))
    persist(get())
  },
  removeWatering: (id) => { set((s) => ({ wateringLog: s.wateringLog.filter((w) => w.id !== id) })); persist(get()) },

  // ── Amendments ──
  addAmendment: (entry) => {
    set((s) => ({ amendmentLog: [...s.amendmentLog, { ...entry, id: s.amendmentIdCounter + 1 }], amendmentIdCounter: s.amendmentIdCounter + 1 }))
    persist(get())
  },
  removeAmendment: (id) => { set((s) => ({ amendmentLog: s.amendmentLog.filter((a) => a.id !== id) })); persist(get()) },

  // ── Soil ──
  addSoilAnalysis: (entry) => {
    set((s) => ({ soilAnalyses: [...s.soilAnalyses, { ...entry, id: s.soilAnalysisIdCounter + 1 }], soilAnalysisIdCounter: s.soilAnalysisIdCounter + 1 }))
    persist(get())
  },
  removeSoilAnalysis: (id) => { set((s) => ({ soilAnalyses: s.soilAnalyses.filter((a) => a.id !== id) })); persist(get()) },

  // ── UI ──
  toast: (message, error = false) => set({ toastMessage: message, toastError: error }),
  clearToast: () => set({ toastMessage: null, toastError: false }),
  setStatus: (text) => set({ statusText: text }),
  setHelpOpen: (open) => set({ helpOpen: open }),
  setDashboardOpen: (open) => set({ dashboardOpen: open }),
  setDashboardTab: (tab) => set({ dashboardTab: tab }),
  openFieldDetail: (fieldId, tab = 'info') => set({ selectedFieldId: fieldId, fieldDetailOpen: true, fieldDetailTab: tab }),
  closeFieldDetail: () => set({ fieldDetailOpen: false }),
  setFieldDetailTab: (tab) => set({ fieldDetailTab: tab }),
  clearAll: () => {
    set((s) => ({
      exploitPolygon: null, exploitArea: 0, exploitLayer: null, exploitLabel: null,
      fields: [], fieldIdCounter: 0, selectedFieldId: null,
      drawTarget: null, currentStep: 1, statusText: 'EN ATTENTE',
      wateringLog: [], amendmentLog: [], soilAnalyses: [],
      employees: s.employees, employeeIdCounter: s.employeeIdCounter, strains: s.strains,
    }))
    persist(get())
  },
}))
