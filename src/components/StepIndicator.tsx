import { useAppStore } from '../store/useAppStore'

const STEPS = ['EXPLOITATION', 'CHAMPS', 'PRÉLÈVEMENTS']

export function StepIndicator() {
  const currentStep = useAppStore((s) => s.currentStep)

  return (
    <div className="flex gap-0 mb-2.5">
      {STEPS.map((label, i) => {
        const n = i + 1
        const isDone = n < currentStep
        const isCurrent = n === currentStep
        return (
          <div
            key={n}
            className={`flex-1 text-center font-mono text-[9px] tracking-[1px] py-1.5 px-1 border-b-2 transition-all
              ${isDone ? 'border-olive-lit text-olive-lit' : ''}
              ${isCurrent ? 'border-amber text-amber' : ''}
              ${!isDone && !isCurrent ? 'border-border text-muted' : ''}`}
          >
            <span className="text-xs font-bold block mb-0.5">{n}</span>
            {label}
          </div>
        )
      })}
    </div>
  )
}
