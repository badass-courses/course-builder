'use server'

import { revalidatePath } from 'next/cache'
import pluralize from 'pluralize'

export async function revalidateModuleLesson(
	moduleSlug: string,
	lessonSlug: string,
	moduleType: string = 'tutorial',
	lessonType?: 'lesson' | 'exercise' | 'solution',
) {
	return revalidatePath(
		`/${pluralize(moduleType)}/${moduleSlug}/${lessonSlug}${lessonType === 'exercise' ? '/exercise' : ''}${lessonType === 'solution' ? '/solution' : ''}`,
	)
}
