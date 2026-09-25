import SiteHeader, { MobileActionBar } from '../SiteHeader'
import SiteFooter from '../SiteFooter'
import { getStartingPrices, getPricingParams } from '@/lib/site/data'
import { getApprovedReviews, toTestimonials } from '@/lib/reviews'
import {
  Hero,
  TrustStrip,
  ServicesSection,
  JourneySection,
  FleetSection,
  LocalSection,
  PartnersSection,
  ReviewsSection,
  HowItWorks,
  FaqSection,
  FinalCta,
} from './sections'

// Express Lyft 2.0 home. Story order: what & book → trust → services →
// experience → fleet → local → B2B → reviews → how → FAQ → close.
export default async function HomeV2() {
  const [prices, pricingParams, reviews] = await Promise.all([getStartingPrices(), getPricingParams(), getApprovedReviews(undefined, 15)])

  return (
    <main style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <SiteHeader overlay bookHref="#booking-form" />
      <Hero prices={pricingParams} />
      <TrustStrip />
      <ServicesSection />
      <JourneySection />
      <FleetSection prices={prices} />
      <LocalSection />
      <PartnersSection />
      <ReviewsSection reviews={toTestimonials(reviews)} />
      <HowItWorks />
      <FaqSection />
      <FinalCta />
      <SiteFooter />
      <MobileActionBar bookHref="#booking-form" />
    </main>
  )
}
