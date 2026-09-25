import ServicePage, { serviceMetadata } from '@/components/site/ServicePage'

export const revalidate = 300
export const metadata = serviceMetadata('group-transportation')

export default function Page() {
  return <ServicePage slug="group-transportation" />
}
