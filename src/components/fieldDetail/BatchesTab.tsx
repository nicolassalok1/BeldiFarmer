import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import type { BatchStage } from '../../types'

const STAGE_LABELS: Record<BatchStage, string> = { semis: 'Semis', germe: 'Germé', pousse: 'Pousse', pret: 'Prêt' }
const STAGE_COLOR: Record<BatchStage, string> = { semis: 'text-muted border-border', germe: 'text-cyan border-cyan/40', pousse: 'text-amber border-amber/40', pret: 'text-olive-lit border-olive-lit/40' }
const STAGE_BG: Record<BatchStage, string> = { semis: 'bg-border/40', germe: 'bg-cyan/20', pousse: 'bg-amber/20', pret: 'bg-olive/20' }

const PLAQUE_PRESETS = [
  { label: '24 (4×6)', rows: 4, cols: 6 },
  { label: '50 (5×10)', rows: 5, cols: 10 },
  { label: '72 (6×12)', rows: 6, cols: 12 },
  { label: '128 (8×16)', rows: 8, cols: 16 },
]

export function BatchesTab() {
  const fieldId = useAppStore((s) => s.selectedFieldId)!
  const field = useAppStore((s) => s.fields.find((f) => f.id === fieldId))!
  const updateField = useAppStore((s) => s.updateField)
  const toast = useAppStore((s) => s.toast)
  const allChamps = useAppStore((s) => s.champs)
  const strains = useAppStore((s) => s.strains)
  const batches = field.batches || []
  const plaques = field.plaques || []
  const archived = !!field.archived
  const targetChamps = allChamps.filter((c) => c.type === 'champ')

  // Batch form — step wizard
  const [adding, setAdding] = useState(false)
  const [step, setStep] = useState(1)
  const [bName, setBName] = useState('')
  const [bStrain, setBStrain] = useState('')
  const [bDate, setBDate] = useState(new Date().toISOString().slice(0, 10))
  const [bSeeds, setBSeeds] = useState(50)
  const [bWeeks, setBWeeks] = useState(3)
  const [bTargetTemp, setBTargetTemp] = useState('')
  const [bTargetHum, setBTargetHum] = useState('')
  const [bTarget, setBTarget] = useState<number | ''>('')
  // Step 2: plaques
  const [bPlaquePreset, setBPlaquePreset] = useState(2) // index in PLAQUE_PRESETS
  const [bPlaqueCount, setBPlaqueCount] = useState(1)

  // Plaque add for existing batch
  const [addingPlaqueFor, setAddingPlaqueFor] = useState<number | null>(null)
  const [apName, setApName] = useState('')
  const [apPreset, setApPreset] = useState(2)

  const nextBatchId = batches.reduce((m, b) => Math.max(m, b.id), 0) + 1
  const nextPlaqueId = plaques.reduce((m, p) => Math.max(m, p.id), 0) + 1

  const selectedPreset = PLAQUE_PRESETS[bPlaquePreset]
  const alveolesPerPlaque = selectedPreset.rows * selectedPreset.cols
  const totalAlveoles = alveolesPerPlaque * bPlaqueCount

  const handleAddBatch = () => {
    if (!bName.trim()) { toast('⚠ Nom du batch requis', true); return }
    if (!bStrain.trim()) { toast('⚠ Strain requise', true); return }
    const batch: typeof batches[0] = {
      id: nextBatchId, name: bName.trim(), strain: bStrain.trim(),
      plantingDate: bDate, seedCount: bSeeds, stage: 'semis',
      weeksToTransplant: bWeeks,
      targetTemp: bTargetTemp ? parseFloat(bTargetTemp) : undefined,
      targetHumidity: bTargetHum ? parseFloat(bTargetHum) : undefined,
      targetChampId: bTarget ? Number(bTarget) : undefined,
    }
    // Auto-create plaques — distribute seeds across plaques
    const newPlaques: typeof plaques = []
    let remaining = bSeeds
    for (let i = 0; i < bPlaqueCount; i++) {
      const filled = Math.min(remaining, alveolesPerPlaque)
      newPlaques.push({
        id: nextPlaqueId + i, name: `${bName.trim()} — Plaque ${i + 1}`,
        rows: selectedPreset.rows, cols: selectedPreset.cols,
        filledCount: Math.max(0, filled),
        batchId: nextBatchId,
      })
      remaining -= filled
    }
    updateField(fieldId, { batches: [...batches, batch], plaques: [...plaques, ...newPlaques] })

    // ── Auto-create agenda activities for this batch ──
    const store = useAppStore.getState()
    const batchLabel = `${bName.trim()} (${bStrain.trim()})`
    const targetName = bTarget ? allChamps.find((c) => c.id === Number(bTarget))?.name : null

    // 1. Semis day
    store.addActivity({
      date: bDate, type: 'other', fieldIds: [], workerCount: 0,
      notes: `${bSeeds} graines · ${bPlaqueCount} plaque(s) ${selectedPreset.rows}×${selectedPreset.cols}`,
      other: { title: `🌱 Semis — ${batchLabel}` },
    })

    // 2. Mid-point check (50% of weeks)
    const midDate = new Date(bDate)
    midDate.setDate(midDate.getDate() + Math.round(bWeeks * 7 / 2))
    store.addActivity({
      date: midDate.toISOString().slice(0, 10), type: 'other', fieldIds: [], workerCount: 0,
      notes: `Vérifier germination, temp, humidité. Objectif : 2-3 noeuds.`,
      other: { title: `🔍 Contrôle germination — ${batchLabel}` },
    })

    // 3. Transplant day
    const transplantDate = new Date(bDate)
    transplantDate.setDate(transplantDate.getDate() + bWeeks * 7)
    store.addActivity({
      date: transplantDate.toISOString().slice(0, 10), type: 'other', fieldIds: [], workerCount: 0,
      notes: targetName ? `Destination : ${targetName}` : 'Champ de destination à définir',
      other: { title: `🚜 TRANSPLANTATION — ${batchLabel}${targetName ? ` → ${targetName}` : ''}` },
    })

    toast(`✓ Batch "${bName.trim()}" + ${bPlaqueCount} plaque(s) créé · 3 jalons ajoutés à l'agenda`)
    setBName(''); setBStrain(''); setBSeeds(50); setBWeeks(3); setBTargetTemp(''); setBTargetHum(''); setBTarget(''); setBPlaqueCount(1); setStep(1); setAdding(false)
  }

  const updateBatch = (id: number, patch: Partial<typeof batches[0]>) => {
    updateField(fieldId, { batches: batches.map((b) => b.id === id ? { ...b, ...patch } : b) })
  }

  const removeBatch = (id: number) => {
    if (!confirm('Supprimer ce batch et ses plaques ?')) return
    updateField(fieldId, { batches: batches.filter((b) => b.id !== id), plaques: plaques.filter((p) => p.batchId !== id) })
    toast('Batch supprimé')
  }

  const handleAddPlaque = (batchId: number) => {
    if (!apName.trim()) { toast('⚠ Nom requis', true); return }
    const pr = PLAQUE_PRESETS[apPreset]
    const plaque: typeof plaques[0] = { id: nextPlaqueId, name: apName.trim(), rows: pr.rows, cols: pr.cols, filledCount: pr.rows * pr.cols, batchId }
    updateField(fieldId, { plaques: [...plaques, plaque] })
    toast(`✓ Plaque créée (${pr.rows}×${pr.cols})`)
    setApName(''); setAddingPlaqueFor(null)
  }

  const updatePlaque = (id: number, patch: Partial<typeof plaques[0]>) => {
    updateField(fieldId, { plaques: plaques.map((p) => p.id === id ? { ...p, ...patch } : p) })
  }

  const removePlaque = (id: number) => {
    if (!confirm('Supprimer cette plaque ?')) return
    updateField(fieldId, { plaques: plaques.filter((p) => p.id !== id) })
  }

  // Transplant date computation
  const transplantDate = (b: typeof batches[0]) => {
    const d = new Date(b.plantingDate)
    d.setDate(d.getDate() + b.weeksToTransplant * 7)
    return d
  }
  const daysLeft = (b: typeof batches[0]) => {
    const diff = transplantDate(b).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-sm text-olive-lit tracking-[2px] uppercase">Germination</h3>
        {!archived && <button onClick={() => setAdding(!adding)} className="btn-sm btn-active text-[10px]">+ Nouveau batch</button>}
      </div>

      {/* ── New batch form — 2-step wizard ── */}
      {adding && (
        <div className="bg-bg border border-olive-lit/40 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="font-mono text-[9px] text-olive-lit uppercase tracking-[1px] flex-1">
              Nouveau batch — Étape {step}/2
            </div>
            <div className="flex gap-1">
              <div className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-olive-lit' : 'bg-border'}`} />
              <div className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-olive-lit' : 'bg-border'}`} />
            </div>
          </div>

          {step === 1 && (<>
            {/* Step 1: Batch info */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="font-mono text-[8px] text-muted uppercase mb-0.5">Nom du batch *</div>
                <input type="text" value={bName} onChange={(e) => setBName(e.target.value)} placeholder="ex: Lot A"
                  className="w-full font-mono text-xs bg-panel border border-border text-text py-1.5 px-2 outline-none focus:border-olive-lit placeholder:text-muted" autoFocus />
              </div>
              <div>
                <div className="font-mono text-[8px] text-muted uppercase mb-0.5">Strain / Variété *</div>
                {strains.length > 0 ? (
                  <select value={bStrain} onChange={(e) => setBStrain(e.target.value)}
                    className="w-full font-mono text-xs bg-panel border border-border text-text py-1.5 px-2 outline-none focus:border-olive-lit">
                    <option value="">— Choisir —</option>
                    {strains.map((s) => <option key={s} value={s}>{s}</option>)}
                    <option value="__custom">Saisie libre...</option>
                  </select>
                ) : (
                  <input type="text" value={bStrain} onChange={(e) => setBStrain(e.target.value)} placeholder="ex: OG Kush"
                    className="w-full font-mono text-xs bg-panel border border-border text-text py-1.5 px-2 outline-none focus:border-olive-lit placeholder:text-muted" />
                )}
              </div>
            </div>
            {bStrain === '__custom' && (
              <input type="text" onChange={(e) => setBStrain(e.target.value)} placeholder="Nom de la strain" autoFocus
                className="w-full font-mono text-xs bg-panel border border-border text-text py-1.5 px-2 outline-none focus:border-olive-lit placeholder:text-muted" />
            )}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="font-mono text-[8px] text-muted uppercase mb-0.5">Date de semis</div>
                <input type="date" value={bDate} onChange={(e) => setBDate(e.target.value)}
                  className="w-full font-mono text-xs bg-panel border border-border text-text py-1.5 px-2 outline-none focus:border-olive-lit" />
              </div>
              <div>
                <div className="font-mono text-[8px] text-muted uppercase mb-0.5">Nb. graines</div>
                <input type="number" min={1} value={bSeeds} onChange={(e) => setBSeeds(parseInt(e.target.value) || 1)}
                  className="w-full font-mono text-xs bg-panel border border-border text-text py-1.5 px-2 outline-none focus:border-olive-lit" />
              </div>
              <div>
                <div className="font-mono text-[8px] text-muted uppercase mb-0.5">Sem. avant transfert</div>
                <input type="number" min={1} max={52} value={bWeeks} onChange={(e) => setBWeeks(parseInt(e.target.value) || 3)}
                  className="w-full font-mono text-xs bg-panel border border-border text-text py-1.5 px-2 outline-none focus:border-olive-lit" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="font-mono text-[8px] text-muted uppercase mb-0.5">T° cible (°C)</div>
                <input type="number" step="0.5" value={bTargetTemp} onChange={(e) => setBTargetTemp(e.target.value)} placeholder="ex: 25"
                  className="w-full font-mono text-xs bg-panel border border-border text-text py-1.5 px-2 outline-none focus:border-olive-lit placeholder:text-muted" />
              </div>
              <div>
                <div className="font-mono text-[8px] text-muted uppercase mb-0.5">Humidité cible (%)</div>
                <input type="number" min={0} max={100} value={bTargetHum} onChange={(e) => setBTargetHum(e.target.value)} placeholder="ex: 70"
                  className="w-full font-mono text-xs bg-panel border border-border text-text py-1.5 px-2 outline-none focus:border-olive-lit placeholder:text-muted" />
              </div>
            </div>
            {targetChamps.length > 0 && (
              <div>
                <div className="font-mono text-[8px] text-muted uppercase mb-0.5">Champ de destination (optionnel)</div>
                <select value={bTarget} onChange={(e) => setBTarget(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full font-mono text-xs bg-panel border border-border text-text py-1.5 px-2 outline-none focus:border-olive-lit">
                  <option value="">— À définir plus tard —</option>
                  {targetChamps.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button className="btn-danger text-[10px]" onClick={() => { setAdding(false); setStep(1) }}>Annuler</button>
              <button className="flex-1 btn-active text-[10px]" onClick={() => {
                if (!bName.trim()) { toast('⚠ Nom du batch requis', true); return }
                if (!bStrain.trim() || bStrain === '__custom') { toast('⚠ Strain requise', true); return }
                setStep(2)
              }}>Suivant → Plaques</button>
            </div>
          </>)}

          {step === 2 && (<>
            {/* Step 2: Plaques — auto-calculated */}
            <div className="bg-panel border border-border p-2.5 mb-1">
              <div className="font-mono text-[10px] text-text">
                <span className="text-amber font-bold">{bName}</span> · <span className="text-cyan">{bStrain}</span> · <span className="text-olive-lit font-bold">{bSeeds} graines</span>
              </div>
            </div>

            <div className="font-mono text-[9px] text-muted uppercase tracking-[1px]">Type de plaque</div>
            <div className="grid grid-cols-2 gap-2">
              {PLAQUE_PRESETS.map((pr, i) => {
                const needed = Math.ceil(bSeeds / (pr.rows * pr.cols))
                return (
                  <button key={pr.label} onClick={() => { setBPlaquePreset(i); setBPlaqueCount(needed) }}
                    className={`text-left p-2.5 border cursor-pointer transition-all ${bPlaquePreset === i ? 'bg-olive/20 border-olive-lit' : 'bg-panel border-border hover:border-olive-lit/50'}`}>
                    <div className="font-mono text-[11px] text-text font-bold">{pr.label}</div>
                    <div className="font-mono text-[9px] text-muted">{pr.rows} lignes × {pr.cols} colonnes</div>
                    <div className="font-mono text-[9px] text-olive-lit mt-0.5">→ {needed} plaque{needed > 1 ? 's' : ''} nécessaire{needed > 1 ? 's' : ''}</div>
                  </button>
                )
              })}
            </div>

            <div className="bg-olive/10 border border-olive-lit/40 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] text-olive-lit font-bold">
                  {bPlaqueCount} plaque{bPlaqueCount > 1 ? 's' : ''} × {alveolesPerPlaque} alvéoles = {totalAlveoles} places
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setBPlaqueCount(Math.max(1, bPlaqueCount - 1))}
                    className="w-6 h-6 font-mono text-sm bg-panel border border-border text-text flex items-center justify-center cursor-pointer hover:border-olive-lit">−</button>
                  <span className="font-mono text-sm text-text w-6 text-center">{bPlaqueCount}</span>
                  <button onClick={() => setBPlaqueCount(bPlaqueCount + 1)}
                    className="w-6 h-6 font-mono text-sm bg-panel border border-border text-text flex items-center justify-center cursor-pointer hover:border-olive-lit">+</button>
                </div>
              </div>
              <div className={`font-mono text-[10px] font-bold ${totalAlveoles >= bSeeds ? 'text-olive-lit' : 'text-red'}`}>
                {totalAlveoles >= bSeeds
                  ? `✓ ${bSeeds} graines placées · ${totalAlveoles - bSeeds} alvéole${totalAlveoles - bSeeds > 1 ? 's' : ''} vide${totalAlveoles - bSeeds > 1 ? 's' : ''}`
                  : `✕ Il manque ${bSeeds - totalAlveoles} place${bSeeds - totalAlveoles > 1 ? 's' : ''} — ajoutez des plaques`}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button className="btn-sm text-[10px] border border-border text-muted hover:text-text bg-transparent cursor-pointer" onClick={() => setStep(1)}>← Retour</button>
              <button className="flex-1 btn-active text-[10px]" onClick={handleAddBatch}>✓ Créer le batch + {bPlaqueCount} plaque{bPlaqueCount > 1 ? 's' : ''}</button>
            </div>
          </>)}
        </div>
      )}

      {batches.length === 0 && !adding && (
        <div className="text-center text-muted text-xs py-6">Aucun batch. Créez-en un pour démarrer la germination.</div>
      )}

      {/* ── Batch cards ── */}
      {batches.map((b) => {
        const bPlaques = plaques.filter((p) => p.batchId === b.id)
        const totalAlveoles = bPlaques.reduce((s, p) => s + p.rows * p.cols, 0)
        const totalFilled = bPlaques.reduce((s, p) => s + p.filledCount, 0)
        const fillPct = totalAlveoles > 0 ? Math.round((totalFilled / totalAlveoles) * 100) : 0
        const dl = daysLeft(b)
        const targetChamp = b.targetChampId ? allChamps.find((c) => c.id === b.targetChampId) : null

        return (
          <div key={b.id} className="border border-border">
            {/* Header */}
            <div className="bg-bg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-text font-bold flex-1 truncate">{b.name}</span>
                <span className={`font-mono text-[9px] px-1.5 py-px border ${STAGE_COLOR[b.stage]}`}>{STAGE_LABELS[b.stage]}</span>
                {!archived && (
                  <button onClick={() => removeBatch(b.id)} className="text-muted hover:text-red bg-transparent border-none cursor-pointer text-xs">✕</button>
                )}
              </div>

              <div className="font-mono text-[10px] text-amber">{b.strain}</div>

              <div className="grid grid-cols-5 gap-1 text-center">
                <div><div className="text-[7px] text-muted uppercase">Graines</div><div className="font-mono text-sm text-olive-lit">{b.seedCount}</div></div>
                <div><div className="text-[7px] text-muted uppercase">Semis</div><div className="font-mono text-[9px] text-text">{new Date(b.plantingDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</div></div>
                <div><div className="text-[7px] text-muted uppercase">T° cible</div><div className="font-mono text-sm text-cyan">{b.targetTemp != null ? `${b.targetTemp}°` : '—'}</div></div>
                <div><div className="text-[7px] text-muted uppercase">H% cible</div><div className="font-mono text-sm text-cyan">{b.targetHumidity != null ? `${b.targetHumidity}%` : '—'}</div></div>
                <div>
                  <div className="text-[7px] text-muted uppercase">Transfert</div>
                  <div className={`font-mono text-sm ${dl <= 0 ? 'text-red font-bold' : dl <= 7 ? 'text-amber' : 'text-muted'}`}>
                    {dl <= 0 ? 'Prêt !' : `${dl}j`}
                  </div>
                </div>
              </div>

              {targetChamp && (
                <div className="font-mono text-[9px] text-muted">
                  Destination : <span className="text-olive-lit">{targetChamp.name}</span>
                </div>
              )}

              {/* Editable stage */}
              {!archived && (
                <select value={b.stage} onChange={(e) => updateBatch(b.id, { stage: e.target.value as BatchStage })}
                  className="w-full font-mono text-[9px] bg-panel border border-border text-text py-1 px-1.5 outline-none focus:border-olive-lit">
                  <option value="semis">Semis</option><option value="germe">Germé</option>
                  <option value="pousse">Pousse</option><option value="pret">Prêt</option>
                </select>
              )}
              {!archived && !b.targetChampId && targetChamps.length > 0 && (
                <select value="" onChange={(e) => updateBatch(b.id, { targetChampId: parseInt(e.target.value) || undefined })}
                  className="w-full font-mono text-[9px] bg-panel border border-amber/40 text-amber py-1 px-1.5 outline-none focus:border-olive-lit">
                  <option value="">+ Définir le champ de destination</option>
                  {targetChamps.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>

            {/* ── Plaques overview ── */}
            <div className="border-t border-border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="font-mono text-[8px] text-muted uppercase tracking-[1px] flex-1">
                  Plaques ({bPlaques.length}) · {totalFilled}/{totalAlveoles} alvéoles ({fillPct}%)
                </div>
                {!archived && (
                  <button onClick={() => { setAddingPlaqueFor(b.id); setApName(`${b.name} — P${bPlaques.length + 1}`) }}
                    className="font-mono text-[8px] px-2 py-0.5 border border-olive-lit/40 text-olive-lit bg-transparent cursor-pointer hover:bg-olive/20">+ Plaque</button>
                )}
              </div>

              {/* Progress bar */}
              {totalAlveoles > 0 && (
                <div className="h-2 bg-border/40 rounded-full overflow-hidden">
                  <div className={`h-full transition-all rounded-full ${STAGE_BG[b.stage]}`} style={{ width: `${fillPct}%` }} />
                </div>
              )}

              {/* Plaque grid — compact cards */}
              {bPlaques.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5">
                  {bPlaques.map((p) => {
                    const total = p.rows * p.cols
                    const pPct = total > 0 ? Math.round((p.filledCount / total) * 100) : 0
                    return (
                      <div key={p.id} className="bg-panel border border-border/60 p-2 space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-[9px] text-text font-semibold flex-1 truncate">{p.name}</span>
                          {!archived && (
                            <button onClick={() => removePlaque(p.id)} className="text-muted hover:text-red bg-transparent border-none cursor-pointer text-[9px]">✕</button>
                          )}
                        </div>
                        <div className="font-mono text-[8px] text-muted">{p.rows}×{p.cols} · {p.filledCount}/{total}</div>
                        <div className="h-1.5 bg-border/40 rounded-full overflow-hidden">
                          <div className="h-full bg-olive-lit rounded-full transition-all" style={{ width: `${pPct}%` }} />
                        </div>
                        {!archived && (
                          <input type="number" min={0} max={total} value={p.filledCount}
                            onChange={(e) => updatePlaque(p.id, { filledCount: Math.min(total, Math.max(0, parseInt(e.target.value) || 0)) })}
                            className="w-full font-mono text-[9px] bg-bg border border-border text-text py-0.5 px-1.5 outline-none focus:border-olive-lit text-center" />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Add plaque form */}
              {addingPlaqueFor === b.id && (
                <div className="bg-panel border border-border p-2 space-y-1.5">
                  <input type="text" value={apName} onChange={(e) => setApName(e.target.value)} placeholder="Nom"
                    className="w-full font-mono text-[10px] bg-bg border border-border text-text py-1 px-2 outline-none focus:border-olive-lit placeholder:text-muted" />
                  <div className="flex flex-wrap gap-1">
                    {PLAQUE_PRESETS.map((pr, i) => (
                      <button key={pr.label} onClick={() => setApPreset(i)}
                        className={`font-mono text-[8px] px-1.5 py-0.5 border cursor-pointer transition-all ${apPreset === i ? 'bg-olive border-olive-lit text-white' : 'bg-bg border-border text-muted'}`}>
                        {pr.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <button className="flex-1 btn-active text-[9px]" onClick={() => handleAddPlaque(b.id)}>✓ Créer</button>
                    <button className="btn-danger text-[9px]" onClick={() => setAddingPlaqueFor(null)}>✕</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
