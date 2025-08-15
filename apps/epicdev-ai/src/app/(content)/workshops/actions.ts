'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { eq } from 'drizzle-orm'
import pluralize from 'pluralize'

export async function revalidateTutorialLesson(
	moduleSlug: string,
	lessonSlug: string,
) {
	return revalidatePath(`/workshops/${moduleSlug}/${lessonSlug}`)
}

export async function removeSection(
	sectionId: string,
	pathToRevalidate: string,
) {
	await db.delete(contentResource).where(eq(contentResource.id, sectionId))
	return await db
		.delete(contentResourceResource)
		.where(eq(contentResourceResource.resourceId, sectionId))
}

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
