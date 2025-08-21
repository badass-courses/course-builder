import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { log } from '@/server/logger'
import { guid } from '@/utils/guid'
import { and, eq, inArray, isNull, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import { ContentResourceResourceSchema } from '@coursebuilder/core/schemas'

import {
	ExerciseSchema,
	type NewExerciseInput,
	type UpdateExerciseInput,
} from './exercises'
import { getCachedLesson } from './lessons-query'

export async function getExercise(exerciseId: string) {
	const exercise = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, exerciseId),
	})
	if (!exercise) return null
	const parsedExercise = ExerciseSchema.parse(exercise)
	return parsedExercise
}

export async function createCoreExercise(input: NewExerciseInput) {
	const exerciseGuid = guid()
	const newExerciseId = `exercise_${exerciseGuid}`

	await db.insert(contentResource).values({
		id: newExerciseId,
		type: 'exercise',
		fields: {
			workshopApp: input.workshopApp,
		},
		createdById: input.createdById ?? '',
		createdAt: new Date(),
	})

	const exercise = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, newExerciseId),
	})

	if (!exercise) {
		throw new Error('Failed to retrieve created exercise')
	}

	const parsedExercise = ExerciseSchema.parse(exercise)
	return parsedExercise
}

export async function createAndAttachExerciseToLesson(input: NewExerciseInput) {
	const exercise = await createCoreExercise(input)
	if (!exercise) {
		throw new Error('Failed to create exercise')
	}
	const resourceRef = await attachExerciseToResource(
		exercise.id,
		input.parentResourceId,
	)
	return { exercise, resourceRef }
}

export async function attachExerciseToResource(
	exerciseId: string,
	parentId: string,
) {
	await db.insert(contentResourceResource).values({
		resourceId: exerciseId,
		resourceOfId: parentId,
		createdAt: new Date(),
	})

	const resourceRef = await db.query.contentResourceResource.findFirst({
		where: and(
			eq(contentResourceResource.resourceId, exerciseId),
			eq(contentResourceResource.resourceOfId, parentId),
		),
	})

	if (!resourceRef) {
		throw new Error('Failed to retrieve created resource relationship')
	}

	const parsedResourceRef = ContentResourceResourceSchema.parse(resourceRef)
	return parsedResourceRef
}

export async function getResourceExercises(resourceId: string) {
	const exerciseIds = await db.query.contentResourceResource.findMany({
		where: and(eq(contentResourceResource.resourceOfId, resourceId)),
		columns: {
			resourceId: true,
		},
	})
	const exercises = await db.query.contentResource.findMany({
		where: and(
			inArray(
				contentResource.id,
				exerciseIds.map((e) => e.resourceId),
			),
			eq(contentResource.type, 'exercise'),
		),
	})
	const parsedExercises = z.array(ExerciseSchema).parse(exercises)
	return parsedExercises
}

export async function removeCoreExercise(exerciseId: string) {
	await db.delete(contentResource).where(eq(contentResource.id, exerciseId))
}

export async function removeAndDetachExerciseFromResource(
	exerciseId: string,
	parentId: string,
) {
	await removeExerciseFromResource(exerciseId, parentId)
	await removeCoreExercise(exerciseId)
}

export async function removeExerciseFromResource(
	exerciseId: string,
	parentId: string,
) {
	await db
		.delete(contentResourceResource)
		.where(
			and(
				eq(contentResourceResource.resourceId, exerciseId),
				eq(contentResourceResource.resourceOfId, parentId),
			),
		)
}

export async function updateExercise(
	exerciseId: string,
	input: UpdateExerciseInput,
) {
	const existing = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, exerciseId),
	})
	const prevFields = existing?.fields ?? {}
	const nextFields = {
		...prevFields,
		workshopApp: {
			...(prevFields.workshopApp ?? {}),
			path: input.workshopApp?.path,
		},
	}
	await db
		.update(contentResource)
		.set({
			fields: nextFields,
			updatedAt: new Date(),
		})
		.where(eq(contentResource.id, exerciseId))
}

/**
 * Get an exercise for a specific lesson
 */
export async function getExerciseForLesson(lessonId: string) {
	log.info('exercise.getForLesson', { lessonId })

	// Use a direct SQL query to get the exercise linked to the lesson
	const query = sql`
		SELECT e.*
		FROM ${contentResource} AS e
		JOIN ${contentResourceResource} AS crr ON e.id = crr.resourceId
		WHERE crr.resourceOfId = ${lessonId}
		  AND e.type = 'exercise'
		  AND e.deletedAt IS NULL
		  AND crr.deletedAt IS NULL
		LIMIT 1;
	`

	try {
		const result = await db.execute(query)

		if (!result.rows.length) {
			log.error('exercise.getForLesson.error', {
				lessonId,
				error: 'No exercise found',
			})
			return null
		}

		// Get the full exercise with its resources
		// Type assertion to handle the SQL result properly
		const exerciseId = (result.rows[0] as { id: string }).id

		const exercise = await db.query.contentResource.findFirst({
			where: and(
				eq(contentResource.id, exerciseId),
				isNull(contentResource.deletedAt),
			),
			with: {
				resources: {
					where: isNull(contentResourceResource.deletedAt),
					with: {
						resource: true,
					},
				},
			},
		})

		const parsedExercise = ExerciseSchema.safeParse(exercise)

		if (!parsedExercise.success) {
			log.error('exercise.getForLesson.error', {
				lessonId,
				error: parsedExercise.error,
			})
			return null
		}

		return parsedExercise.data
	} catch (error) {
		log.error('exercise.getForLesson.error', {
			error,
			lessonId,
		})
		return null
	}
}
