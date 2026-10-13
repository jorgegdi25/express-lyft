import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import HomeV2 from '@/components/site/home/HomeV2'
import { SITE_V2_LIVE } from '@/lib/site/contact'

export const dynamic = 'force-dynamic'

// Express Lyft 2.0 preview in production (explyft.com/home). The root
// page keeps the current site until launch.
export const metadata: Metadata = {
  alternates: { canonical: SITE_V2_LIVE ? '/' : '/home' },
  robots: SITE_V2_LIVE ? undefined : { index: false, follow: false },
}

export default function HomePreviewPage() {
  // After launch the site lives at /; old preview links land there.
  if (SITE_V2_LIVE) permanentRedirect('/')
  return <HomeV2 />
}
