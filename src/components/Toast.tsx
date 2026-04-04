import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

export function Toast() {
  const message = useAppStore((s) => s.toastMessage)
  const isError = useAppStore((s) => s.toastError)
  const clearToast = useAppStore((s) => s.clearToast)

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(clearToast, 2500)
    return () => clearTimeout(timer)
  }, [message, clearToast])

  return (
    <div
      className={`fixed bottom-5 right-5 bg-panel border px-4 py-2.5 font-mono text-xs z-[9999] transition-all duration-200 pointer-events-none
        ${message ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        ${isError ? 'border-red text-red' : 'border-olive text-olive-lit'}`}
    >
      {message}
    </div>
  )
}
