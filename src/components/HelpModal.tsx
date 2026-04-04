import { useAppStore } from '../store/useAppStore'

export function HelpModal() {
  const open = useAppStore((s) => s.helpOpen)
  const setHelpOpen = useAppStore((s) => s.setHelpOpen)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) setHelpOpen(false) }}
    >
      <div className="bg-panel border border-border p-7 max-w-[620px] w-[90vw] max-h-[85vh] overflow-y-auto relative scrollbar-thin scrollbar-thumb-border">
        <button
          onClick={() => setHelpOpen(false)}
          className="absolute top-3 right-4 bg-transparent border-none text-muted text-xl cursor-pointer hover:text-red transition-colors"
        >
          ✕
        </button>

        <h2 className="font-mono text-sm text-olive-lit tracking-[2px] mb-5 pr-8">
          PRÉLÈVEMENTS GPS — ANRAC
        </h2>
        <p className="text-[13px] text-text leading-relaxed mb-2">
          Outil de terrain pour définir l'exploitation, ses champs et générer automatiquement
          les points de prélèvement GPS.
        </p>

        <h3 className="font-mono text-[11px] text-olive-lit tracking-[2px] mt-5 mb-2.5 border-b border-border pb-1.5">
          WORKFLOW EN 3 ÉTAPES
        </h3>
        <ol className="list-none p-0 m-0 mb-4 counter-reset-step">
          {[
            ['Exploitation', "Dessinez le périmètre global de votre exploitation. C'est la zone qui vous appartient."],
            ['Champs', "À l'intérieur de l'exploitation, dessinez vos différents champs. Chaque champ doit être entièrement contenu dans l'exploitation."],
            ['Points', 'Générez automatiquement les points de prélèvement dans chaque champ selon la méthode et la densité choisies.'],
          ].map(([title, desc], i) => (
            <li key={i} className="pl-7 relative mb-1.5 text-[13px] leading-relaxed text-text">
              <span className="absolute left-0 font-mono text-[11px] text-black bg-olive-lit w-5 h-5 flex items-center justify-center rounded-full">
                {i + 1}
              </span>
              <strong className="text-amber">{title}</strong> — {desc}
            </li>
          ))}
        </ol>

        <h3 className="font-mono text-[11px] text-olive-lit tracking-[2px] mt-5 mb-2.5 border-b border-border pb-1.5">
          MÉTHODES DE GÉNÉRATION
        </h3>
        <ul className="ml-4 mb-3 text-[13px] text-text leading-loose list-disc">
          <li><strong className="text-amber">Grille régulière</strong> — points uniformément espacés</li>
          <li><strong className="text-amber">Zigzag (W)</strong> — parcours en W, classique pour prélèvements de sol</li>
          <li><strong className="text-amber">Aléatoire stratifié</strong> — points aléatoires avec espacement minimum</li>
        </ul>

        <h3 className="font-mono text-[11px] text-olive-lit tracking-[2px] mt-5 mb-2.5 border-b border-border pb-1.5">
          EXPORT
        </h3>
        <ul className="ml-4 mb-3 text-[13px] text-text leading-loose list-disc">
          <li><strong className="text-amber">CSV</strong> — Champ, Label, Latitude, Longitude (8 décimales)</li>
          <li><strong className="text-amber">GeoJSON</strong> — points + polygones (exploitation et champs)</li>
          <li><strong className="text-amber">KML</strong> — Placemarks par dossier</li>
        </ul>

        <div className="font-mono text-[11px] text-muted mt-4 pt-3 border-t border-border leading-relaxed">
          Leaflet.js 1.9.4 · Leaflet.draw 1.0.4 · CartoDB Dark · React + TypeScript + Tailwind<br />
          Usage interne ANRAC
        </div>
      </div>
    </div>
  )
}
