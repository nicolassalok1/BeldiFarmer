import { useAppStore } from '../store/useAppStore'
import { BatchesTab } from './fieldDetail/BatchesTab'
import { CultureTab } from './fieldDetail/CultureTab'
import { InfoTab } from './fieldDetail/InfoTab'
import { OtherActivitiesTab } from './fieldDetail/OtherActivitiesTab'
import { SoilTab } from './fieldDetail/SoilTab'
import { ReliefTab } from './fieldDetail/ReliefTab'
import { WateringTab } from './fieldDetail/WateringTab'
import { AmendmentsTab } from './fieldDetail/AmendmentsTab'
import type { FieldDetailTab } from '../types'

const TABS: { key: FieldDetailTab; label: string }[] = [
  { key: 'info', label: 'Infos' },
  { key: 'culture', label: 'Culture' },
  { key: 'watering', label: 'Arrosage' },
  { key: 'amendments', label: 'Engrais' },
  { key: 'other', label: 'Autres' },
  { key: 'soil', label: 'Sol' },
  { key: 'relief', label: 'Relief' },
  { key: 'batches', label: 'Germination' },
]

export function FieldDetailPanel() {
  const open = useAppStore((s) => s.fieldDetailOpen)
  const tab = useAppStore((s) => s.fieldDetailTab)
  const setTab = useAppStore((s) => s.setFieldDetailTab)
  const close = useAppStore((s) => s.closeFieldDetail)
  const fieldId = useAppStore((s) => s.selectedFieldId)
  const field = useAppStore((s) => s.fields.find((f) => f.id === fieldId))
  const champs = useAppStore((s) => s.champs)

  if (!open || !field) return null

  const parentChamp = field.champId ? champs.find((c) => c.id === field.champId) : null
  const isSerre = parentChamp?.type === 'serre'
  const visibleTabs = isSerre
    ? TABS.filter((t) => t.key !== 'soil' && t.key !== 'relief')
    : TABS.filter((t) => t.key !== 'batches')

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex justify-end" onClick={(e) => { if (e.target === e.currentTarget) close() }}>
      <div className="w-full md:w-[480px] md:max-w-[90vw] h-full bg-panel border-l border-border flex flex-col animate-[slideIn_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-3 border-b border-border shrink-0">
          <div className="w-3 h-3 rounded-full" style={{ background: field.color }} />
          <h2 className={`font-mono text-xs md:text-sm font-bold flex-1 truncate ${field.archived ? 'text-muted line-through' : 'text-text'}`}>{field.name}</h2>
          {field.archived && (
            <span className="font-mono text-[9px] px-1.5 py-0.5 border border-amber text-amber uppercase tracking-[1px]">Archivée</span>
          )}
          <span className="font-mono text-[10px] text-muted">{field.area.toFixed(2)} ha</span>
          <button onClick={close} className="text-muted hover:text-red bg-transparent border-none text-lg cursor-pointer transition-colors">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border shrink-0 overflow-x-auto">
          {visibleTabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-[.5px] border-b-2 whitespace-nowrap transition-all cursor-pointer bg-transparent border-x-0 border-t-0
                ${tab === t.key ? 'border-olive-lit text-olive-lit' : 'border-transparent text-muted hover:text-text'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 md:p-5">
          {tab === 'info' && <InfoTab />}
          {tab === 'culture' && <CultureTab />}
          {tab === 'watering' && <WateringTab />}
          {tab === 'amendments' && <AmendmentsTab />}
          {tab === 'other' && <OtherActivitiesTab />}
          {tab === 'soil' && <SoilTab />}
          {tab === 'relief' && <ReliefTab />}
          {tab === 'batches' && <BatchesTab />}
        </div>
      </div>
    </div>
  )
}

