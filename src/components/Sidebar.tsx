import { useAppStore } from '../store/useAppStore'
import { StepIndicator } from './StepIndicator'
import { exportCSV, exportGeoJSON, exportKML, exportProject, parseProjectFile } from '../utils/exporters'
import { saveToStorage } from '../utils/persistence'
import type { GenerationMethod } from '../types'

export function Sidebar() {
  const store = useAppStore()

  const totalPoints = store.fields.reduce((s, f) => s + f.points.length, 0)

  const handleExport = (type: 'csv' | 'geojson' | 'kml') => {
    let count = 0
    if (type === 'csv') count = exportCSV(store.fields)
    else if (type === 'geojson') count = exportGeoJSON(store.fields, store.exploitPolygon, store.exploitArea)
    else count = exportKML(store.fields)

    if (count === 0) store.toast('⚠ Aucun point à exporter', true)
    else store.toast(`✓ ${type.toUpperCase()} exporté — ${count} points`)
  }

  const handleSave = () => {
    const ok = exportProject({
      fields: store.fields, exploitPolygon: store.exploitPolygon,
      exploitArea: store.exploitArea, fieldIdCounter: store.fieldIdCounter,
      generationMethod: store.generationMethod, density: store.density,
      employees: store.employees, employeeIdCounter: store.employeeIdCounter,
      strains: store.strains, wateringLog: store.wateringLog,
      wateringIdCounter: store.wateringIdCounter, amendmentLog: store.amendmentLog,
      amendmentIdCounter: store.amendmentIdCounter, soilAnalyses: store.soilAnalyses,
      soilAnalysisIdCounter: store.soilAnalysisIdCounter,
    })
    if (ok) store.toast('✓ Projet exporté en JSON')
    else store.toast('⚠ Rien à exporter', true)
  }

  const handleLoad = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const data = parseProjectFile(reader.result as string)
        if (!data) { store.toast('⚠ Fichier invalide', true); return }
        if (store.exploitLayer) { store.exploitLayer.remove(); store.exploitLabel?.remove() }
        store.fields.forEach((f) => { f.layer?.remove(); f.labelMarker?.remove(); f.pointMarkers.forEach((m) => m.remove()) })
        store.clearAll()
        saveToStorage(data)
        window.location.reload()
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleClearAll = () => {
    if (store.exploitLayer) { store.exploitLayer.remove(); store.exploitLabel?.remove() }
    store.fields.forEach((f) => { f.layer?.remove(); f.labelMarker?.remove(); f.pointMarkers.forEach((m) => m.remove()) })
    store.clearAll()
    store.toast('Carte réinitialisée')
  }

  return (
    <aside className="bg-panel border-r border-border flex flex-col overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-border scrollbar-track-bg">

      {/* Dashboard button */}
      <button
        onClick={() => store.setDashboardOpen(true)}
        className="m-3 mb-0 py-2.5 bg-amber/10 border border-amber text-amber font-semibold text-sm tracking-[2px] uppercase cursor-pointer hover:bg-amber hover:text-black transition-all flex items-center justify-center gap-2"
      >
        <span className="text-base">◈</span> DASHBOARD
      </button>

      {/* Step indicator */}
      <Section>
        <StepIndicator />
      </Section>

      {/* Step 1: Exploitation */}
      <Section>
        <SectionTitle>Zone exploitation</SectionTitle>
        {!store.exploitPolygon ? (
          <button
            className={`btn-full ${store.drawTarget === 'exploit' ? 'btn-danger' : 'btn-cyan'}`}
            onClick={() => {
              if (store.drawTarget === 'exploit') { store.setDrawTarget(null); store.setStatus('EN ATTENTE') }
              else { store.setDrawTarget('exploit'); store.setStatus('DESSIN EXPLOITATION — cliquez les sommets') }
            }}
          >
            {store.drawTarget === 'exploit' ? '■ Annuler' : '◈ Dessiner l\'exploitation'}
          </button>
        ) : (
          <div className="bg-bg border border-border p-2 font-mono text-[11px] text-text flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan shrink-0" />
            <span className="flex-1">
              Exploitation — <span className="text-cyan">{store.exploitArea.toFixed(2)} ha</span>
            </span>
            <button className="btn-sm btn-danger" onClick={handleClearAll}>Redessiner</button>
          </div>
        )}
      </Section>

      {/* Step 2: Fields */}
      {store.exploitPolygon && (
        <Section>
          <SectionTitle>Ajouter un champ</SectionTitle>
          <div className="flex gap-1.5 mb-1.5">
            <input id="field-name-input" type="text" placeholder="Nom du champ"
              className="flex-1 font-mono text-xs bg-bg border border-border text-text py-1.5 px-2.5 outline-none focus:border-olive-lit placeholder:text-muted" />
          </div>
          <button
            className={`btn-full ${store.drawTarget === 'field' ? 'btn-danger' : 'btn-active'}`}
            onClick={() => {
              if (store.drawTarget === 'field') { store.setDrawTarget(null); store.setStatus('EN ATTENTE') }
              else {
                const input = document.getElementById('field-name-input') as HTMLInputElement
                if (!input.value.trim()) { store.toast('⚠ Saisissez un nom', true); input.focus(); return }
                store.setDrawTarget('field'); store.setStatus('DESSIN CHAMP — cliquez les sommets')
              }
            }}
          >
            {store.drawTarget === 'field' ? '■ Annuler' : '▭ Dessiner le champ'}
          </button>
        </Section>
      )}

      {/* Step 3: Generation */}
      {store.fields.length > 0 && (
        <Section>
          <SectionTitle>Génération points</SectionTitle>
          <div className="flex items-center gap-2 mb-1.5">
            <label className="text-[10px] text-muted min-w-[55px] uppercase">Méthode</label>
            <select value={store.generationMethod} onChange={(e) => store.setGenerationMethod(e.target.value as GenerationMethod)}
              className="font-mono text-xs bg-bg border border-border text-text py-1 px-2 outline-none flex-1 focus:border-olive-lit">
              <option value="grid">Grille régulière</option>
              <option value="zigzag">Zigzag (W)</option>
              <option value="random">Aléatoire stratifié</option>
            </select>
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <label className="text-[10px] text-muted min-w-[55px] uppercase">Densité</label>
            <input type="number" value={store.density} min={0.5} max={20} step={0.5}
              onChange={(e) => store.setDensity(parseFloat(e.target.value) || 1)}
              className="font-mono text-xs bg-bg border border-border text-text py-1 px-2 outline-none flex-1 focus:border-olive-lit" />
            <span className="text-[10px] text-muted">pts/ha</span>
          </div>
          <button className="btn-full btn-amber" id="btn-generate-all">⊕ Générer tous les points</button>
        </Section>
      )}

      {/* Stats compact */}
      <Section>
        <div className="grid grid-cols-3 gap-1.5">
          <StatBox label="Exploit." value={store.exploitArea > 0 ? store.exploitArea.toFixed(1) : '—'} unit="ha" />
          <StatBox label="Champs" value={String(store.fields.length)} unit="zones" />
          <StatBox label="Points" value={String(totalPoints)} unit="pts" />
        </div>
      </Section>

      {/* Export & Save */}
      <Section>
        <SectionTitle>Export & Sauvegarde</SectionTitle>
        <div className="flex gap-1 mb-1">
          <button className="btn-amber flex-1 text-[10px] py-1" onClick={() => handleExport('csv')}>CSV</button>
          <button className="btn-amber flex-1 text-[10px] py-1" onClick={() => handleExport('geojson')}>GeoJSON</button>
          <button className="btn-amber flex-1 text-[10px] py-1" onClick={() => handleExport('kml')}>KML</button>
        </div>
        <div className="flex gap-1 mb-1">
          <button className="btn-cyan flex-1 text-[10px] py-1" onClick={handleSave}>↓ Sauvegarder</button>
          <button className="btn-active flex-1 text-[10px] py-1" onClick={handleLoad}>↑ Charger</button>
        </div>
        <button className="btn-danger w-full text-[10px] py-1 mt-0.5" onClick={() => {
          if (window.confirm('Êtes-vous sûr de vouloir tout effacer ?\nCette action est irréversible.')) handleClearAll()
        }}>✕ Tout effacer</button>
      </Section>

    </aside>
  )
}

function Section({ children }: { children: React.ReactNode }) {
  return <div className="p-3 px-4 border-b border-border">{children}</div>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10px] text-olive-lit tracking-[2px] mb-2 flex items-center gap-1.5 before:content-[''] before:w-3 before:h-px before:bg-olive-lit uppercase">
      {children}
    </div>
  )
}

function StatBox({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-bg border border-border p-1.5 px-2">
      <div className="text-[9px] text-muted tracking-[1px] uppercase">{label}</div>
      <div className="font-mono text-base text-olive-lit mt-0.5">{value}</div>
      <div className="text-[9px] text-muted">{unit}</div>
    </div>
  )
}
