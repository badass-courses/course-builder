'use server'

import { revalidatePath } from 'next/cache'
import pluralize from 'pluralize'

export async function revalidateTutorialLesson(
	moduleSlug: string,
	lessonSlug: string,
	moduleType: string = 'tutorial',
) {
	return revalidatePath(`/${pluralize(moduleType)}/${moduleSlug}/${lessonSlug}`)
}
