import { create } from 'zustand'
import type { AppState } from '../types'

export const FIELD_COLORS = [
  '#8fa84f', '#e6a817', '#a84f6a', '#4f6aa8', '#a8854f',
  '#8a4fa8', '#4fa85e', '#cf4a4a', '#4a8fcf', '#cfcf4a',
]

export const useAppStore = create<AppState>((set) => ({
  // Exploitation
  exploitPolygon: null,
  exploitArea: 0,
  exploitLayer: null,
  exploitLabel: null,

  // Fields
  fields: [],
  fieldIdCounter: 0,
  selectedFieldId: null,

  // Drawing
  drawTarget: null,

  // Generation config
  generationMethod: 'grid',
  density: 1,

  // UI
  currentStep: 1,
  toastMessage: null,
  toastError: false,
  statusText: 'EN ATTENTE',
  helpOpen: false,

  // Actions
  setExploitation: (polygon, area, layer, label) =>
    set({ exploitPolygon: polygon, exploitArea: area, exploitLayer: layer, exploitLabel: label, currentStep: 2 }),

  clearExploitation: () =>
    set({
      exploitPolygon: null, exploitArea: 0, exploitLayer: null, exploitLabel: null,
      fields: [], fieldIdCounter: 0, selectedFieldId: null, currentStep: 1,
    }),

  addField: (field) =>
    set((s) => ({
      fields: [...s.fields, field],
      fieldIdCounter: field.id,
      selectedFieldId: field.id,
      currentStep: 3,
    })),

  removeField: (id) =>
    set((s) => {
      const remaining = s.fields.filter((f) => f.id !== id)
      return {
        fields: remaining,
        selectedFieldId: s.selectedFieldId === id ? (remaining[0]?.id ?? null) : s.selectedFieldId,
        currentStep: remaining.length === 0 ? 2 : 3,
      }
    }),

  selectField: (id) => set({ selectedFieldId: id }),

  setFieldPoints: (fieldId, points, markers) =>
    set((s) => ({
      fields: s.fields.map((f) =>
        f.id === fieldId ? { ...f, points, pointMarkers: markers } : f
      ),
    })),

  removePoint: (fieldId, pointIndex) =>
    set((s) => ({
      fields: s.fields.map((f) => {
        if (f.id !== fieldId) return f
        const newPoints = [...f.points]
        newPoints.splice(pointIndex, 1)
        const newMarkers = [...f.pointMarkers]
        newMarkers.splice(pointIndex, 1)
        return { ...f, points: newPoints, pointMarkers: newMarkers }
      }),
    })),

  setDrawTarget: (target) => set({ drawTarget: target }),
  setGenerationMethod: (method) => set({ generationMethod: method }),
  setDensity: (density) => set({ density }),

  toast: (message, error = false) => set({ toastMessage: message, toastError: error }),
  clearToast: () => set({ toastMessage: null, toastError: false }),
  setStatus: (text) => set({ statusText: text }),
  setHelpOpen: (open) => set({ helpOpen: open }),

  clearAll: () =>
    set({
      exploitPolygon: null, exploitArea: 0, exploitLayer: null, exploitLabel: null,
      fields: [], fieldIdCounter: 0, selectedFieldId: null,
      drawTarget: null, currentStep: 1, statusText: 'EN ATTENTE',
    }),
}))
