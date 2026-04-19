import { useEffect, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { computeFieldRelief } from '../../utils/terrain-auto'
import { triggerAutoReliefIfNeeded } from '../../utils/relief-background'
import { useField, Label, EXPO_LABELS } from './shared'
import type { Exposition } from '../../types'

export function ReliefTab() {
  const field = useField()
  const updateField = useAppStore((s) => s.updateField)
  const toast = useAppStore((s) => s.toast)
  const r = field.relief || { exposition: 'plat' as Exposition }
  const [computing, setComputing] = useState(false)

  // Auto-trigger relief compute the first time the user opens this tab on a
  // zone that has no relief yet. Also handles the spinner state so the user
  // sees that something is happening during the 3-5 s API round-trip.
  // The trigger helper skips silently if relief is already set or if the
  // user has manually locked it, so this effect is a cheap no-op otherwise.
  useEffect(() => {
    if (field.relief !== undefined) return
    setComputing(true)
    triggerAutoReliefIfNeeded(field.id).finally(() => setComputing(false))
    // Depend on the id only — not on `field.relief` — so that re-renders
    // triggered by the compute result itself don't re-fire the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field.id])

  // Any manual edit clears the autoComputed flag → locks the relief against
  // future background recomputations (e.g. after a polygon edit). The
  // updateField action persists to localStorage on every call.
  const update = (patch: Partial<typeof r>) =>
    updateField(field.id, { relief: { ...r, ...patch, autoComputed: false } })

  const handleAutoCompute = async () => {
    setComputing(true)
    try {
      const { relief, warnings, sampleCount } = await computeFieldRelief(field)
      updateField(field.id, { relief })
      if (warnings.length > 0) {
        toast(`⚠ Relief partiellement calculé (${sampleCount} pts) — ${warnings[0]}`, true)
      } else {
        toast(`✓ Relief calculé (${sampleCount} pts DEM)`)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue'
      toast(`⚠ ${msg}`, true)
    } finally {
      setComputing(false)
    }
  }

  const isAuto = field.relief?.autoComputed === true
  const hasRelief = field.relief !== undefined

  return (
    <div className="space-y-4">
      {/* Auto-compute button + status badge */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleAutoCompute}
          disabled={computing}
          className="btn-cyan flex-1 text-[11px] py-2 disabled:opacity-50 disabled:cursor-wait"
          title="Calcule altitude, pente, exposition et ensoleillement à partir du polygone (Open-Meteo, gratuit)"
        >
          {computing ? '⏳ Calcul…' : hasRelief ? '✨ Recalculer' : '✨ Calculer automatiquement'}
        </button>
        {hasRelief && (
          <span
            className={`font-mono text-[9px] px-2 py-1 border ${isAuto ? 'text-cyan border-cyan/60' : 'text-amber border-amber/60'}`}
            title={isAuto ? 'Valeurs calculées automatiquement — seront mises à jour si vous modifiez le contour' : 'Valeurs modifiées manuellement — ne seront plus recalculées automatiquement'}
          >
            {isAuto ? 'AUTO' : 'MANUEL'}
          </span>
        )}
      </div>

      {/* Visible loading banner while the background/manual compute is running.
          The form stays interactive so the user can still edit manually, but
          the banner makes it clear that a background fetch is in flight. */}
      {computing && (
        <div className="bg-cyan/10 border border-cyan/40 p-2.5 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan animate-pulse" />
          <span className="font-mono text-[10px] text-cyan">
            Calcul en cours via Open-Meteo (altitude + ensoleillement)…
          </span>
        </div>
      )}

      <div>
        <Label>Exposition</Label>
        <select value={r.exposition} onChange={(e) => update({ exposition: e.target.value as Exposition })}
          className="w-full font-mono text-xs bg-bg border border-border text-text py-2 px-3 outline-none focus:border-olive-lit">
          {Object.entries(EXPO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <Label>Ensoleillement (h/jour)</Label>
        <input type="number" value={r.sunlightHours ?? ''} placeholder="—" min={0} max={16} step={0.1}
          onChange={(e) => update({ sunlightHours: e.target.value ? parseFloat(e.target.value) : undefined })}
          className="w-full font-mono text-xs bg-bg border border-border text-text py-2 px-3 outline-none focus:border-olive-lit placeholder:text-muted" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Alt. min (m)</Label>
          <input type="number" value={r.altitudeMin ?? ''} placeholder="—"
            onChange={(e) => update({ altitudeMin: e.target.value ? parseFloat(e.target.value) : undefined })}
            className="w-full font-mono text-xs bg-bg border border-border text-text py-2 px-3 outline-none focus:border-olive-lit placeholder:text-muted" />
        </div>
        <div>
          <Label>Alt. max (m)</Label>
          <input type="number" value={r.altitudeMax ?? ''} placeholder="—"
            onChange={(e) => update({ altitudeMax: e.target.value ? parseFloat(e.target.value) : undefined })}
            className="w-full font-mono text-xs bg-bg border border-border text-text py-2 px-3 outline-none focus:border-olive-lit placeholder:text-muted" />
        </div>
        <div>
          <Label>Pente (%)</Label>
          <input type="number" value={r.slope ?? ''} placeholder="—" min={0} max={100} step={0.1}
            onChange={(e) => update({ slope: e.target.value ? parseFloat(e.target.value) : undefined })}
            className="w-full font-mono text-xs bg-bg border border-border text-text py-2 px-3 outline-none focus:border-olive-lit placeholder:text-muted" />
        </div>
      </div>
    </div>
  )
}
