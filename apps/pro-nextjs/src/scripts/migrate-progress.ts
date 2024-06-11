import fs from 'fs/promises'
import { db } from '@/db'
import { resourceProgress } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { resourceProgressSchema } from '@coursebuilder/core/schemas'

// await writeContributionTypes()

const skillLessonProgressSchema = z.object({
	id: z.string(),
	userId: z.string(),
	lessonId: z.string().nullable(),
	sectionId: z.string().nullable(),
	moduleId: z.string().nullable(),
	lessonSlug: z.string().nullable(),
	lessonVersion: z.string().nullable(),
	completedAt: z.date().nullable(),
	updatedAt: z.date().nullable(),
	createdAt: z.date(),
})

type LessonProgressSchema = z.infer<typeof skillLessonProgressSchema>

export async function migrateLessonProgress(WRITE_TO_DB: boolean = true) {
	const lessonProgress = await db.query.lessonProgress.findMany()

	const parsedLessonProgress = z
		.array(skillLessonProgressSchema)
		.safeParse(lessonProgress)

	if (!parsedLessonProgress.success) {
		console.error(parsedLessonProgress.error)
		return
	}

	const lessonProgresses = parsedLessonProgress.data

	for (const lessonProgress of lessonProgresses) {
		const existingProgress =
			lessonProgress.lessonId &&
			(await db.query.resourceProgress.findFirst({
				where: and(
					eq(resourceProgress.userId, lessonProgress.userId),
					eq(resourceProgress.resourceId, lessonProgress.lessonId),
				),
			}))

		if (!existingProgress) {
			const transformedProgress = resourceProgressSchema.parse({
				userId: lessonProgress.userId,
				resourceId: lessonProgress.lessonId || null,
				fields: {},
				completedAt: lessonProgress.completedAt
					? lessonProgress.completedAt
					: null,
				updatedAt: lessonProgress.updatedAt ? lessonProgress.updatedAt : null,
				createdAt: lessonProgress.createdAt
					? lessonProgress.createdAt
					: new Date(),
			})

			console.info('created resource progress', {
				resourceId: lessonProgress.lessonId,
			})

			if (WRITE_TO_DB) {
				await db.insert(resourceProgress).values({
					...transformedProgress,
					createdAt: lessonProgress.createdAt
						? lessonProgress.createdAt
						: new Date(),
				})
			} else {
				await fs.writeFile(
					'lesson-progress.json',
					JSON.stringify(
						{
							...transformedProgress,
							createdAt: lessonProgress.createdAt
								? lessonProgress.createdAt
								: new Date(),
						},
						null,
						2,
					),
				)
			}
		}
	}
}
