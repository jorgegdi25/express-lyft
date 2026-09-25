import type { ReactNode } from 'react'

// Visible marker for content the client still has to confirm. Only used on
// pages that are live on the test site; remove each one once confirmed.
export default function Pending({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold align-middle"
      style={{ border: '1px dashed #d97706', color: '#f59e0b', background: 'rgba(217,119,6,0.08)' }}
      title="Pending confirmation from Express Lyft"
    >
      TODO · {children}
    </span>
  )
}
