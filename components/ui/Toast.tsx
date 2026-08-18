'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
}

const VARIANT_STYLES: Record<ToastVariant, { border: string; icon: string; iconColor: string }> = {
  success: { border: '#10B981', icon: '✓', iconColor: '#10B981' },
  error: { border: '#ef4444', icon: '✕', iconColor: '#f87171' },
  info: { border: 'var(--gold)', icon: 'ℹ', iconColor: 'var(--gold-light)' },
}

const ToastContext = createContext<((message: string, variant?: ToastVariant) => void) | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = nextId.current++
    setItems((prev) => [...prev, { id, message, variant }])
    setTimeout(() => dismiss(id), 4500)
  }, [dismiss])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 w-full max-w-sm px-4 sm:px-0"
        aria-live="polite"
      >
        {items.map((item) => {
          const style = VARIANT_STYLES[item.variant]
          return (
            <div
              key={item.id}
              role="status"
              className="flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg animate-[toast-in_0.2s_ease-out]"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-soft)',
                borderLeft: `3px solid ${style.border}`,
              }}
            >
              <span className="text-sm font-bold leading-5" style={{ color: style.iconColor }}>
                {style.icon}
              </span>
              <p className="flex-1 text-sm leading-5" style={{ color: 'var(--text)' }}>
                {item.message}
              </p>
              <button
                onClick={() => dismiss(item.id)}
                className="text-sm leading-5 transition-colors"
                style={{ color: 'var(--text-faint)' }}
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
