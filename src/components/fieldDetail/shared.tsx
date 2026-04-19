import { useAppStore } from '../../store/useAppStore'
import type { Field, IrrigationMethod, AmendmentType, Exposition } from '../../types'

// ── Label tables ──────────────────────────────────────────────

export const IRRIGATION_LABELS: Record<IrrigationMethod, string> = {
  goutte_a_goutte: 'Goutte à goutte',
  aspersion: 'Aspersion',
  gravitaire: 'Gravitaire',
  manuel: 'Manuel',
}

export const AMENDMENT_LABELS: Record<AmendmentType, string> = {
  organique: 'Organique',
  mineral: 'Minéral',
  foliaire: 'Foliaire',
  correcteur: 'Correcteur',
}

export const EXPO_LABELS: Record<Exposition, string> = {
  nord: '↑ Nord',
  'nord-est': '↗ Nord-Est',
  est: '→ Est',
  'sud-est': '↘ Sud-Est',
  sud: '↓ Sud',
  'sud-ouest': '↙ Sud-Ouest',
  ouest: '← Ouest',
  'nord-ouest': '↖ Nord-Ouest',
  plat: '⊙ Plat',
}

// ── Hook ──────────────────────────────────────────────────────

/**
 * Read the currently-selected field from the store. Non-null by construction:
 * the parent FieldDetailPanel renders tabs only when a field is selected and
 * open, so sub-components can assume the field exists.
 */
export function useField(): Field {
  const fieldId = useAppStore((s) => s.selectedFieldId)!
  return useAppStore((s) => s.fields.find((f) => f.id === fieldId))!
}

// ── Presentational helpers ────────────────────────────────────

export function Label({ children }: { children: React.ReactNode }) {
  return <div className="font-mono text-[9px] text-muted uppercase tracking-[1px] mb-1">{children}</div>
}

export function Empty({ text }: { text: string }) {
  return <div className="text-center text-muted text-xs py-6">{text}</div>
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg border border-border p-2">
      <div className="text-[9px] text-muted uppercase">{label}</div>
      <div className="font-mono text-sm text-olive-lit mt-0.5">{value}</div>
    </div>
  )
}
