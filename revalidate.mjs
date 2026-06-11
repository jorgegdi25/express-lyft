import { revalidatePath } from 'next/cache'
export default async function () {
  revalidatePath('/hotel/[slug]', 'page')
}
