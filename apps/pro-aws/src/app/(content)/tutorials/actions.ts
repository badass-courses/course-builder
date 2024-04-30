'use server'

import { revalidatePath } from 'next/cache'
import { getNextResource } from '@/lib/resources/get-next-resource'

export async function getNextLesson({ resourceId }: { resourceId: string }) {
	const nextLesson = await getNextResource(resourceId)

	return { nextLesson }
}

export async function revalidateTutorialLesson(
	moduleSlug: string,
	lessonSlug: string,
) {
	return revalidatePath(`/tutorials/${moduleSlug}/${lessonSlug}`)
}
