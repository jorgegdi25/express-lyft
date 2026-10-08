'use client'

import { useState } from 'react'
import { FAQ_CATEGORIES, type FaqItem } from '@/lib/site/faq'

// Accordion built on <details> so answers stay in the HTML for search
// engines. With `categories`, shows filter chips (used on /faq).
export default function FaqList({ items, categories = false }: { items: FaqItem[]; categories?: boolean }) {
  const [cat, setCat] = useState<string>('All')
  const cats = ['All', ...FAQ_CATEGORIES.filter((c) => items.some((i) => i.category === c))]
  const shown = cat === 'All' ? items : items.filter((i) => i.category === cat)

  return (
    <div>
      {categories && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 -mx-4 px-4 md:mx-0 md:px-0">
          {cats.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={cat === c}
              onClick={() => setCat(c)}
              className="shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-colors"
              style={{
                background: cat === c ? 'var(--text)' : 'transparent',
                color: cat === c ? 'var(--bg-deep)' : 'var(--text-subtle)',
                border: `1px solid ${cat === c ? 'var(--text)' : 'var(--border-soft)'}`,
              }}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-col divide-y" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', borderColor: 'var(--border)' }}>
        {shown.map((f) => (
          <details key={f.id} className="group [&_summary::-webkit-details-marker]:hidden" style={{ borderColor: 'var(--border)' }}>
            <summary className="flex items-center justify-between gap-6 py-5 cursor-pointer list-none text-base md:text-lg font-semibold text-white hover:text-[var(--gold-light)]">
              <span>{f.q}</span>
              <span className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-transform group-open:rotate-45" style={{ border: '1px solid var(--border-soft)', color: 'var(--gold-light)' }} aria-hidden>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
              </span>
            </summary>
            <p className="pb-6 pr-12 text-[15px] leading-relaxed" style={{ color: 'var(--text-subtle)' }}>{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
