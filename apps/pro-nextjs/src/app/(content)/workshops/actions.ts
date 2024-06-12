'use server'

import { revalidatePath } from 'next/cache'

export async function revalidateTutorialLesson(
	moduleSlug: string,
	lessonSlug: string,
) {
	return revalidatePath(`/tutorials/${moduleSlug}/${lessonSlug}`)
}
