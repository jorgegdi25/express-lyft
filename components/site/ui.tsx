import Link from 'next/link'
import type { ReactNode } from 'react'

// Small building blocks for the corporate site, following the Express Lyft
// brand guidelines: Montserrat, black / #191919 / white, and the metallic
// gold gradient reserved for the primary action.

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`max-w-7xl mx-auto px-4 md:px-8 ${className}`}>{children}</div>
}

export function Eyebrow({ children }: { children: ReactNode; tone?: 'dark' | 'light' }) {
  return (
    <p
      className="text-[11px] font-medium uppercase tracking-[0.32em] mb-4"
      style={{ color: 'var(--gold-light)' }}
    >
      {children}
    </p>
  )
}

export function Heading({
  children,
  as: Tag = 'h2',
  className = '',
  tone = 'dark',
}: {
  children: ReactNode
  as?: 'h1' | 'h2' | 'h3'
  className?: string
  tone?: 'dark' | 'light'
}) {
  return (
    <Tag
      className={`font-display font-semibold leading-[1.12] tracking-[-0.02em] ${className}`}
      style={{ color: tone === 'light' ? 'var(--ink-dark)' : 'var(--text)' }}
    >
      {children}
    </Tag>
  )
}

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'dark'

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-light)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]'

const BUTTON_SIZES = {
  md: 'px-5 h-11',
  lg: 'px-7 h-[52px]',
}

function variantStyle(variant: ButtonVariant): React.CSSProperties {
  switch (variant) {
    case 'primary':
      return { background: 'var(--brand-gold-gradient)', color: 'var(--button-ink)' }
    case 'outline':
      return { border: '1px solid var(--border-soft)', color: 'var(--text)' }
    case 'dark':
      return { background: '#fff', color: '#000' }
    default:
      return { color: 'var(--text)' }
  }
}

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  external,
  ...rest
}: {
  href: string
  children: ReactNode
  variant?: ButtonVariant
  size?: 'md' | 'lg'
  className?: string
  external?: boolean
  'aria-label'?: string
}) {
  const cls = `${BUTTON_BASE} ${BUTTON_SIZES[size]} ${variant === 'primary' ? 'hover:brightness-105' : variant === 'outline' ? 'hover:border-[var(--gold-light)] hover:text-[var(--gold-light)]' : 'hover:opacity-90'} ${className}`
  const isExternal = external ?? /^(https?:|tel:|mailto:)/.test(href)
  if (isExternal) {
    return (
      <a href={href} className={cls} style={variantStyle(variant)} {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={cls} style={variantStyle(variant)} {...rest}>
      {children}
    </Link>
  )
}

export function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export function WhatsAppIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.45 9.45 0 0 1-4.82-1.32l-.35-.2-3.58.94.96-3.49-.23-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.21 4.25-9.46 9.48-9.46 2.53 0 4.9.99 6.69 2.78a9.4 9.4 0 0 1 2.77 6.69c0 5.22-4.25 9.46-9.46 9.46zm8.05-17.5A11.32 11.32 0 0 0 12.04.66C5.77.66.66 5.76.66 12.04c0 2 .52 3.96 1.52 5.69L.57 23.62l6.03-1.58a11.35 11.35 0 0 0 5.44 1.39h.01c6.27 0 11.38-5.11 11.38-11.39 0-3.04-1.18-5.9-3.34-8.05z" />
    </svg>
  )
}

export function PhoneIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}
