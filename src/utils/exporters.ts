import type { PersistedData } from './persistence'
import { normalizePersistedData } from './persistence'

function download(filename: string, content: string, mime: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([content], { type: mime }))
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

// ── Export/Import projet complet ──

/**
 * Export the entire project as JSON. Accepts a PersistedData-shaped payload
 * so that every persistable field (including activities, archived zones,
 * agenda tasks, etc.) is included by default — no risk of data loss at export.
 */
export function exportProject(data: PersistedData): boolean {
  if (!data.exploitPolygon && (!data.fields || data.fields.length === 0)) return false

  const date = new Date().toISOString().slice(0, 10)
  download(`projet-anrac-${date}.json`, JSON.stringify(data, null, 2), 'application/json')
  return true
}

export function parseProjectFile(content: string): PersistedData | null {
  try {
    const raw = JSON.parse(content) as PersistedData
    if (!raw.exploitPolygon && (!raw.fields || raw.fields.length === 0)) return null
    // Apply defaults so older JSON files (without activities/agendaTasks/archived) load cleanly.
    return normalizePersistedData(raw)
  } catch {
    return null
  }
}
