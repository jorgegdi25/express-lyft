'use client'

import { createContext, useCallback, useContext, useState } from 'react'

interface ConfirmOptions {
  danger?: boolean
  confirmLabel?: string
  cancelLabel?: string
}

interface PendingConfirm extends ConfirmOptions {
  message: string
  resolve: (value: boolean) => void
}

type ConfirmFn = (message: string, options?: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider')
  return ctx
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const confirmFn = useCallback<ConfirmFn>((message, options = {}) => {
    return new Promise((resolve) => {
      setPending({ message, resolve, ...options })
    })
  }, [])

  const settle = (value: boolean) => {
    pending?.resolve(value)
    setPending(null)
  }

  return (
    <ConfirmContext.Provider value={confirmFn}>
      {children}
      {pending && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.6)' }}
          onClick={() => settle(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl p-6 animate-[dialog-in_0.15s_ease-out]"
            style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)' }}
          >
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              {pending.message}
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => settle(false)}
                className="px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                style={{ color: 'var(--text-subtle)', border: '1px solid var(--border-soft)' }}
              >
                {pending.cancelLabel || 'Cancel'}
              </button>
              <button
                onClick={() => settle(true)}
                autoFocus
                className="px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                style={
                  pending.danger
                    ? { background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.5)' }
                    : { background: 'var(--gold)', color: 'var(--bg-deep)' }
                }
              >
                {pending.confirmLabel || (pending.danger ? 'Delete' : 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
