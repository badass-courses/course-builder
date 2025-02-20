import { courseBuilderAdapter, db } from '@/db'
import { contentResource } from '@/db/schema'
import { log } from '@/server/logger'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { eq, sql } from 'drizzle-orm'

import { SolutionSchema } from './solution'
import type {
	CreateSolutionInput,
	Solution,
	UpdateSolutionInput,
} from './solution'

/**
 * Get a solution by its ID, including its parent lesson data
 */
export async function getSolution(id: string): Promise<Solution | null> {
	const solution = await db.query.contentResource.findFirst({
		where: sql`
			${contentResource.id} = ${id} AND
			${contentResource.type} = 'solution'
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
	const solution = await db.query.contentResource.findFirst({
		where: sql`
			${contentResource.type} = 'solution' AND
			JSON_EXTRACT(${contentResource.fields}, "$.parentLessonId") = ${lessonId}
		`,
	})

	if (!solution) return null

	const parsed = SolutionSchema.safeParse(solution)
	if (!parsed.success) {
		log.error('invalid_solution_data', {
			lessonId,
			error: parsed.error,
		})
		return null
	}

	return parsed.data
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
			${contentResource.type} = 'lesson'
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
