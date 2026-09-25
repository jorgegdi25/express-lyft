import ServicePage, { serviceMetadata } from '@/components/site/ServicePage'

export const revalidate = 300
export const metadata = serviceMetadata('corporate-transportation')

export default function Page() {
  return <ServicePage slug="corporate-transportation" />
}
