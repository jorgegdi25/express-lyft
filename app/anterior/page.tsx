import type { Metadata } from 'next'
import LegacyHome from '@/components/LegacyHome'

export const dynamic = 'force-dynamic'

// Read-only copy of the home page from before Express Lyft 2.0, kept so the
// team can compare or roll back. Never indexed.
export const metadata: Metadata = {
  title: 'Express Lyft — previous home (archive)',
  robots: { index: false, follow: false },
}

export default function PreviousHomePage({ searchParams }: { searchParams: { success?: string; tab?: string } }) {
  return <LegacyHome searchParams={searchParams} />
}
