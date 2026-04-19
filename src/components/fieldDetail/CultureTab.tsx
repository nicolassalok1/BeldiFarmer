import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useField, Label } from './shared'
import type { SeedType } from '../../types'

/**
 * Default Cali strains — always offered, even before the user adds any custom
 * ones. Per CLAUDE.md this list lives here and nowhere else.
 */
const DEFAULT_CALI_STRAINS = ['Cali Water', 'Mochi Coco', 'One Hitter', 'Yuzu']

export function CultureTab() {
  const field = useField()
  const updateField = useAppStore((s) => s.updateField)
  const userStrains = useAppStore((s) => s.strains)
  const seedType = field.culture?.seedType || 'beldia'
  const strain = field.culture?.strain || ''
  const [customStrain, setCustomStrain] = useState('')

  // Merge default strains + user-added strains (deduplicated)
  const allStrains = [...new Set([...DEFAULT_CALI_STRAINS, ...userStrains])]

  return (
    <div className="space-y-4">
      <div>
        <Label>Type de graine</Label>
        <select value={seedType}
          onChange={(e) => { const t = e.target.value as SeedType; updateField(field.id, { culture: { seedType: t, strain: t === 'beldia' ? '' : strain } }) }}
          className="w-full font-mono text-xs bg-bg border border-border text-text py-2 px-3 outline-none focus:border-olive-lit">
          <option value="beldia">Beldia</option>
          <option value="cali">Cali</option>
        </select>
      </div>
      {seedType === 'cali' && (
        <div>
          <Label>Strain</Label>
          <select value={allStrains.includes(strain) ? strain : (strain ? '__custom' : '')}
            onChange={(e) => {
              if (e.target.value === '__custom') { setCustomStrain(strain); return }
              updateField(field.id, { culture: { seedType: 'cali', strain: e.target.value } })
            }}
            className="w-full font-mono text-xs bg-bg border border-border text-text py-2 px-3 outline-none focus:border-olive-lit">
            <option value="">— Choisir —</option>
            {allStrains.map((s) => <option key={s} value={s}>{s}</option>)}
            <option value="__custom">Custom...</option>
          </select>
          {(strain && !allStrains.includes(strain)) || customStrain !== '' ? (
            <div className="flex gap-2 mt-1.5">
              <input type="text" value={customStrain || strain} onChange={(e) => setCustomStrain(e.target.value)}
                placeholder="Nom de la strain" autoFocus
                className="flex-1 font-mono text-xs bg-bg border border-border text-text py-1.5 px-2 outline-none focus:border-olive-lit placeholder:text-muted" />
              <button className="btn-sm btn-active text-[10px]" onClick={() => {
                if (customStrain.trim()) {
                  updateField(field.id, { culture: { seedType: 'cali', strain: customStrain.trim() } })
                  setCustomStrain('')
                }
              }}>✓</button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
