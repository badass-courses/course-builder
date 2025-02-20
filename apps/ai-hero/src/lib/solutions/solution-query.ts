'use server'

import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { log } from '@/server/logger'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { and, eq, sql } from 'drizzle-orm'

import { SolutionSchema } from './solution'
import type {
	CreateSolutionInput,
	Solution,
	UpdateSolutionInput,
} from './solution'

import 'server-only'

import { getServerAuthSession } from '@/server/auth'

import { ContentResourceSchema } from '@coursebuilder/core/schemas'

import { Post, PostSchema } from '../posts'

/**
 * Get a solution by its ID, including its parent lesson data
 */
export async function getSolution(id: string): Promise<Solution | null> {
	const solution = await db.query.contentResource.findFirst({
		where: sql`
			${contentResource.id} = ${id} AND
			JSON_EXTRACT(${contentResource.fields}, "$.postType") = 'solution'
		`,
	})

	if (!solution) return null

	const parsed = SolutionSchema.safeParse(solution)
	if (!parsed.success) {
		log.error('invalid_solution_data', {
			solutionId: id,
			error: parsed.error,
		})
		return null
	}

	return parsed.data
}

/**
 * Get a solution for a specific lesson
 */
export async function getSolutionForLesson(
	lessonId: string,
): Promise<Solution | null> {
	const query = sql`SELECT *
		FROM ${contentResource} AS cr_lesson
		JOIN ${contentResourceResource} AS crr ON cr_lesson.id = crr.resourceOfId
		JOIN ${contentResource} AS cr_video ON crr.resourceId = cr_video.id
		WHERE (cr_lesson.id = ${lessonId} OR JSON_UNQUOTE(JSON_EXTRACT(cr_lesson.fields, '$.slug')) = ${lessonId})
			AND JSON_EXTRACT(cr_video.fields, "$.postType") = 'solution'
		LIMIT 1;`

	const result = await db.execute(query)

	if (!result.rows.length) return null

	const solutionResourceRow = ContentResourceSchema.parse(result.rows[0])

	return SolutionSchema.parse(solutionResourceRow)
}

export const addSolutionResourceToLesson = async ({
	solutionResourceId,
	lessonId,
}: {
	solutionResourceId: string
	lessonId: string
}) => {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const solutionResource = await db.query.contentResource.findFirst({
		where: sql`
			JSON_EXTRACT(${contentResource.fields}, "$.postType") = 'solution' AND
			${contentResource.id} = ${solutionResourceId}
		`,
		with: {
			resources: true,
		},
	})

	const lesson = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, lessonId),
		with: {
			resources: true,
		},
	})

	if (!lesson) {
		throw new Error(`Lesson with id ${lessonId} not found`)
	}

	if (!solutionResource) {
		throw new Error(`Solution Resource with id ${solutionResource} not found`)
	}

	await db.insert(contentResourceResource).values({
		resourceOfId: lesson.id,
		resourceId: solutionResource.id,
		position: lesson.resources.length,
	})

	return db.query.contentResourceResource.findFirst({
		where: and(
			eq(contentResourceResource.resourceOfId, lesson.id),
			eq(contentResourceResource.resourceId, solutionResource.id),
		),
		with: {
			resource: true,
		},
	})
}

/**
 * Create a new solution
 */
export async function createSolution(
	input: CreateSolutionInput,
): Promise<Solution> {
	// Check if lesson exists
	const lesson = await db.query.contentResource.findFirst({
		where: sql`
			${contentResource.id} = ${input.parentLessonId} AND
			JSON_EXTRACT(${contentResource.fields}, "$.postType") = 'lesson'
		`,
	})

	if (!lesson) {
		throw new Error('Parent lesson not found')
	}

	// Check if solution already exists for this lesson
	const existingSolution = await getSolutionForLesson(input.parentLessonId)
	if (existingSolution) {
		throw new Error('Solution already exists for this lesson')
	}

	const solutionGuid = guid()
	const newSolutionId = `solution_${solutionGuid}`

	const solution = await courseBuilderAdapter.createContentResource({
		id: newSolutionId,
		type: 'solution',
		fields: {
			title: input.title,
			postType: 'solution',
			parentLessonId: input.parentLessonId,
			state: 'draft',
			visibility: 'unlisted',
			slug: `${slugify(input.title)}~${guid()}`,
		},
		createdById: input.createdById || '', // Provide empty string as fallback
	})

	if (!solution) {
		throw new Error('Failed to create solution')
	}

	const parsed = SolutionSchema.safeParse(solution)
	if (!parsed.success) {
		log.error('invalid_solution_data', {
			solutionId: solution.id,
			error: parsed.error,
		})
		throw new Error('Created solution failed validation')
	}

	log.info('solution_created', {
		solutionId: solution.id,
		lessonId: input.parentLessonId,
	})

	return parsed.data
}

export const getParentLesson = async (
	solutionId: string,
): Promise<Post | null> => {
	const solutionLessonJoin = await db.query.contentResourceResource.findFirst({
		where: eq(contentResourceResource.resourceId, solutionId),
		with: {
			resourceOf: true,
		},
	})

	return PostSchema.nullable().parse(solutionLessonJoin?.resourceOf || null)
}

/**
 * Update an existing solution
 */
export async function updateSolution(
	id: string,
	input: UpdateSolutionInput,
): Promise<Solution> {
	const solution = await courseBuilderAdapter.updateContentResourceFields({
		id,
		fields: input.fields,
	})

	if (!solution) {
		throw new Error('Failed to update solution')
	}

	const parsed = SolutionSchema.safeParse(solution)
	if (!parsed.success) {
		log.error('invalid_solution_data', {
			solutionId: id,
			error: parsed.error,
		})
		throw new Error('Updated solution failed validation')
	}

	log.info('solution_updated', {
		solutionId: solution.id,
	})

	return parsed.data
}

/**
 * Delete a solution
 */
export async function deleteSolution(id: string): Promise<void> {
	await db.delete(contentResource).where(eq(contentResource.id, id))

	log.info('solution_deleted', {
		solutionId: id,
	})
}
