import { useAppStore } from '../store/useAppStore'

export function Header() {
  const statusText = useAppStore((s) => s.statusText)
  const setHelpOpen = useAppStore((s) => s.setHelpOpen)
  const helpOpen = useAppStore((s) => s.helpOpen)
  const setDashboardOpen = useAppStore((s) => s.setDashboardOpen)

  return (
    <header className="col-span-full bg-panel border-b border-border flex items-center gap-4 px-5 h-[52px]">
      <div className="font-mono text-[11px] text-olive-lit tracking-[2px] border border-olive px-2 py-0.5">
        ANRAC
      </div>
      <h1 className="text-[15px] font-semibold tracking-[3px] uppercase text-text">
        Gestion Exploitation & Prélèvements
      </h1>
      <div className="ml-auto font-mono text-[11px] text-muted flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-olive-lit animate-[pulse_2s_infinite]" />
        <span>{statusText}</span>
      </div>
      <button
        onClick={() => setDashboardOpen(true)}
        className="font-mono text-[11px] text-muted border border-border px-2.5 py-1 cursor-pointer hover:border-amber hover:text-amber transition-all tracking-[1px]"
      >
        DASHBOARD
      </button>
      <button
        onClick={() => setHelpOpen(!helpOpen)}
        className="font-mono text-[13px] text-muted border border-border w-7 h-7 flex items-center justify-center cursor-pointer hover:border-olive-lit hover:text-olive-lit transition-all"
      >
        ?
      </button>
    </header>
  )
}
