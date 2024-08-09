'use server'

import { revalidatePath } from 'next/cache'
import pluralize from 'pluralize'

export async function revalidateModuleLesson(
	moduleSlug: string,
	lessonSlug: string,
	moduleType: string = 'tutorial',
) {
	return revalidatePath(`/${pluralize(moduleType)}/${moduleSlug}/${lessonSlug}`)
}
