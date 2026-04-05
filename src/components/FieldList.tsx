import L from 'leaflet'
import { useAppStore } from '../store/useAppStore'
import type { Field } from '../types'

export function FieldList() {
  const fields = useAppStore((s) => s.fields)
  const selectedFieldId = useAppStore((s) => s.selectedFieldId)
  const selectField = useAppStore((s) => s.selectField)
  const exploitPolygon = useAppStore((s) => s.exploitPolygon)
  const employees = useAppStore((s) => s.employees)

  if (!fields.length) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 px-4 text-center text-muted text-xs leading-relaxed">
          {exploitPolygon
            ? 'Exploitation définie.\nAjoutez maintenant vos champs.'
            : 'Commencez par dessiner\nle périmètre de votre exploitation.'}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-bg">
      {fields.map((f) => (
        <div key={f.id}>
          {/* Field card */}
          <div
            className={`border-b border-border p-2.5 px-4 cursor-pointer transition-colors hover:bg-olive/10
              ${f.id === selectedFieldId ? 'bg-olive/15 border-l-[3px] border-l-olive-lit' : ''}`}
            onClick={() => {
              selectField(f.id)
              if (f.layer) {
                const map = (f.layer as unknown as { _map: L.Map })._map
                if (map) map.fitBounds(f.layer.getBounds(), { padding: [40, 40] })
              }
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: f.color }} />
              <span className="font-ui text-[13px] font-semibold text-text flex-1">{f.name}</span>
              <span className="font-mono text-[9px] text-amber bg-amber/10 border border-amber/25 px-1.5 py-px">
                {f.points.length} pts
              </span>
            </div>
            <div className="font-mono text-[10px] text-muted leading-relaxed">
              {f.area.toFixed(2)} ha · {Math.round(f.perimeter)} m
            </div>
            <FieldMeta field={f} employees={employees} />
            <div className="flex gap-1 mt-1.5">
              <button
                className="btn-sm btn-amber"
                onClick={(e) => { e.stopPropagation(); document.getElementById('btn-generate-' + f.id)?.click() }}
                data-field-id={f.id}
                id={`btn-regen-${f.id}`}
              >
                ⊕ Générer
              </button>
              <button
                className="btn-sm btn-danger"
                onClick={(e) => {
                  e.stopPropagation()
                  f.layer?.remove()
                  f.labelMarker?.remove()
                  f.pointMarkers.forEach((m) => m.remove())
                  useAppStore.getState().removeField(f.id)
                  useAppStore.getState().toast(`Champ "${f.name}" supprimé`)
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Points sub-list */}
          {f.points.map((pt, i) => (
            <div
              key={`${f.id}-${i}`}
              className="font-mono text-[10px] text-muted py-1 px-4 pl-8 border-b border-border/50 cursor-pointer transition-colors hover:bg-amber/5 flex items-center gap-1.5"
              onClick={() => {
                const marker = f.pointMarkers[i]
                if (marker) {
                  const map = (marker as unknown as { _map: L.Map })._map
                  if (map) map.setView([pt.lat, pt.lng], 17)
                  marker.openPopup()
                }
              }}
            >
              <span className="text-amber min-w-[36px]">{pt.label}</span>
              <span className="flex-1">{pt.lat.toFixed(6)}, {pt.lng.toFixed(6)}</span>
              <button
                className="text-border bg-transparent border-none cursor-pointer text-xs px-0.5 hover:text-red transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  const marker = f.pointMarkers[i]
                  if (marker) marker.remove()
                  useAppStore.getState().removePoint(f.id, i)
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function FieldMeta({ field, employees }: { field: Field; employees: { id: number; name: string; role: string }[] }) {
  const culture = field.culture
  const manager = field.assignedManager ? employees.find((e) => e.id === field.assignedManager) : null
  const assigned = field.assignedEmployees.map((eid) => employees.find((e) => e.id === eid)).filter(Boolean)
  const waterCount = useAppStore((s) => s.wateringLog.filter((w) => w.fieldId === field.id).length)
  const amendCount = useAppStore((s) => s.amendmentLog.filter((a) => a.fieldId === field.id).length)
  const soilCount = useAppStore((s) => s.soilAnalyses.filter((a) => a.fieldId === field.id).length)
  const relief = field.relief

  const hasInfo = culture || manager || assigned.length || waterCount || amendCount || soilCount || relief
  if (!hasInfo) return null

  return (
    <div className="mt-1 font-mono text-[9px] text-muted leading-relaxed space-y-0.5">
      {culture && (
        <div>
          <span className="text-olive-lit">Culture:</span>{' '}
          {culture.seedType === 'beldia' ? 'Beldia' : `Cali${culture.strain ? ' — ' + culture.strain : ''}`}
        </div>
      )}
      {manager && <div><span className="text-amber">Resp:</span> {manager.name}</div>}
      {assigned.length > 0 && <div><span className="text-olive-lit">Équipe:</span> {assigned.map((e) => e!.name).join(', ')}</div>}
      {relief && <div><span className="text-cyan">Expo:</span> {relief.exposition}{relief.sunlightHours ? ` · ${relief.sunlightHours}h soleil` : ''}</div>}
      {(waterCount > 0 || amendCount > 0 || soilCount > 0) && (
        <div className="flex gap-2 mt-0.5">
          {waterCount > 0 && <span className="text-cyan">{waterCount} arrosage{waterCount > 1 ? 's' : ''}</span>}
          {amendCount > 0 && <span className="text-olive-lit">{amendCount} amend.</span>}
          {soilCount > 0 && <span className="text-amber">{soilCount} analyse{soilCount > 1 ? 's' : ''}</span>}
        </div>
      )}
    </div>
  )
}
