'use client'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: React.ReactNode
}

const VARIANTS: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
    color: 'var(--bg-deep)',
    border: '1px solid transparent',
    boxShadow: '0 4px 14px -6px rgba(184,150,12,0.6)',
  },
  secondary: {
    background: 'var(--surface-raised)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-subtle)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'rgba(239,68,68,0.10)',
    color: '#f87171',
    border: '1px solid rgba(239,68,68,0.35)',
  },
  success: {
    background: 'rgba(16,185,129,0.10)',
    color: '#34d399',
    border: '1px solid rgba(16,185,129,0.35)',
  },
}

export default function Button({
  variant = 'secondary', size = 'md', icon, children, className = '', ...rest
}: ButtonProps) {
  const sizing = size === 'sm'
    ? 'px-2.5 py-1.5 text-[11px] gap-1.5'
    : 'px-4 py-2.5 text-xs gap-2'

  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center rounded-[10px] font-bold uppercase tracking-widest transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${sizing} ${className}`}
      style={{ ...VARIANTS[variant], ...rest.style }}
    >
      {icon}
      {children}
    </button>
  )
}
