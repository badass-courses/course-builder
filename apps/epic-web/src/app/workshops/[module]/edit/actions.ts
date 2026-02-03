'use server'

import { revalidatePath } from 'next/cache'

export async function revalidateWorkshopPath(slug: string) {
	revalidatePath(`/workshops/${slug}`)
	revalidatePath(`/workshops/${slug}/edit`)
}
