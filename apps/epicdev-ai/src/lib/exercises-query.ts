import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { guid } from '@/utils/guid'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

import { ContentResourceResourceSchema } from '@coursebuilder/core/schemas'

import {
	ExerciseSchema,
	type NewExerciseInput,
	type UpdateExerciseInput,
} from './exercises'

export async function getExercise(exerciseId: string) {
	const exercise = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, exerciseId),
	})
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
		createdById: input.createdById,
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
	await removeCoreExercise(exerciseId)
	await removeExerciseFromResource(exerciseId, parentId)
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
	await db
		.update(contentResource)
		.set({
			fields: {
				workshopApp: {
					path: input.workshopApp?.path,
				},
			},
			updatedAt: new Date(),
		})
		.where(eq(contentResource.id, exerciseId))
}
