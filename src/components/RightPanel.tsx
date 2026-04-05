import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { FieldList } from './FieldList'

export function RightPanel() {
  const fields = useAppStore((s) => s.fields)
  const [allPointsVisible, setAllPointsVisible] = useState(true)

  const totalPoints = fields.reduce((s, f) => s + f.points.length, 0)

  const toggleAllPoints = () => {
    const next = !allPointsVisible
    setAllPointsVisible(next)
    fields.forEach((f) => {
      f.pointMarkers.forEach((m) => {
        const el = (m as unknown as { _icon: HTMLElement })._icon
        if (el) el.style.display = next ? '' : 'none'
      })
    })
  }

  return (
    <aside className="bg-panel border-l border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border flex items-center gap-2">
        <div className="font-mono text-[10px] text-olive-lit tracking-[2px] flex-1 flex items-center gap-1.5 before:content-[''] before:w-3 before:h-px before:bg-olive-lit uppercase">
          Champs & points
        </div>
        {totalPoints > 0 && (
          <button
            onClick={toggleAllPoints}
            className={`font-mono text-[10px] px-2 py-0.5 border cursor-pointer transition-all
              ${allPointsVisible
                ? 'text-amber bg-amber/10 border-amber/25 hover:bg-amber/20'
                : 'text-muted bg-transparent border-border hover:border-muted'}`}
            title={allPointsVisible ? 'Masquer tous les points' : 'Afficher tous les points'}
          >
            {allPointsVisible ? '◉ Masquer pts' : '○ Afficher pts'}
          </button>
        )}
      </div>

      {/* Field list */}
      <FieldList />
    </aside>
  )
}
