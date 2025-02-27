'use server'

import { revalidateTag } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { Solution, SolutionSchema } from '@/lib/solution'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { and, eq, isNull, or, sql } from 'drizzle-orm'

/**
 * Get a solution for a specific lesson
 */
export async function getSolutionForLesson(lessonId: string) {
	const resourceJoin = await db.query.contentResourceResource.findFirst({
		where: and(
			eq(contentResourceResource.resourceOfId, lessonId),
			isNull(contentResourceResource.deletedAt),
		),
		with: {
			resource: true,
		},
	})

	if (
		!resourceJoin?.resource ||
		resourceJoin.resource.type !== 'solution' ||
		resourceJoin.resource.deletedAt
	) {
		return null
	}

	return SolutionSchema.parse(resourceJoin.resource)
}

/**
 * Get solution by ID or slug
 */
export async function getSolution(solutionSlugOrId: string) {
	const solution = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(
					sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
					solutionSlugOrId,
				),
				eq(contentResource.id, solutionSlugOrId),
			),
			eq(contentResource.type, 'solution'),
			isNull(contentResource.deletedAt),
		),
	})

	if (!solution) {
		return null
	}

	const parsedSolution = SolutionSchema.safeParse(solution)
	if (!parsedSolution.success) {
		console.error('Error parsing solution', solution, parsedSolution.error)
		return null
	}

	return parsedSolution.data
}

/**
 * Create a new solution for a lesson
 */
export async function createSolution({
	lessonId,
	title,
	body,
	slug,
	description,
}: {
	lessonId: string
	title: string
	body?: string
	slug: string
	description?: string
}) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	try {
		// Create the solution resource with required fields
		const solution = await courseBuilderAdapter.createContentResource({
			type: 'solution',
			fields: {
				title,
				body: body || '',
				slug,
				description: description || '',
				state: 'draft',
				visibility: 'unlisted',
			},
			createdById: user.id,
		} as any) // Using 'any' to bypass the type check as the adapter likely handles the ID generation

		// Create the link between lesson and solution
		await db.insert(contentResourceResource).values({
			resourceId: solution.id,
			resourceOfId: lessonId,
			position: 0,
		})

		log.info('solution.created', {
			solutionId: solution.id,
			lessonId,
			userId: user.id,
		})

		revalidateTag('solution')
		return solution
	} catch (error) {
		log.error('solution.create.error', {
			error,
			lessonId,
			userId: user.id,
		})
		throw error
	}
}

/**
 * Update an existing solution
 */
export async function updateSolution(input: Partial<Solution>) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user || !ability.can('update', 'Content')) {
		throw new Error('Unauthorized')
	}

	// Ensure we have an ID to look up
	const id = input.id
	if (!id) {
		throw new Error('Solution ID is required for updates')
	}

	const currentSolution = await getSolution(id)

	if (!currentSolution) {
		throw new Error(`Solution with id ${id} not found.`)
	}

	let solutionSlug = currentSolution.fields.slug

	// Handle title changes for slug updates
	if (
		input.fields?.title &&
		input.fields.title !== currentSolution.fields.title
	) {
		const splitSlug = currentSolution?.fields.slug.split('~') || ['', guid()]
		solutionSlug = `${slugify(input.fields.title)}~${splitSlug[1] || guid()}`
	}

	const updatedResource = courseBuilderAdapter.updateContentResourceFields({
		id: currentSolution.id,
		fields: {
			...currentSolution.fields,
			...input.fields,
			slug: solutionSlug,
		},
	})

	log.info('solution.updated', {
		solutionId: currentSolution.id,
		userId: user.id,
	})

	revalidateTag('solution')
	return updatedResource
}

/**
 * Delete a solution
 */
export async function deleteSolution(solutionId: string) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user || !ability.can('delete', 'Content')) {
		throw new Error('Unauthorized')
	}

	try {
		// Find the resource join first
		const resourceJoin = await db.query.contentResourceResource.findFirst({
			where: and(
				eq(contentResourceResource.resourceId, solutionId),
				isNull(contentResourceResource.deletedAt),
			),
		})

		if (!resourceJoin) {
			throw new Error('Solution not found or not linked to a lesson')
		}

		// Soft delete the solution
		await db
			.update(contentResource)
			.set({
				deletedAt: new Date(),
			})
			.where(eq(contentResource.id, solutionId))

		// Soft delete the resource join
		await db
			.update(contentResourceResource)
			.set({
				deletedAt: new Date(),
			})
			.where(eq(contentResourceResource.resourceId, solutionId))

		log.info('solution.deleted', {
			solutionId,
			lessonId: resourceJoin.resourceOfId,
			userId: user.id,
		})

		revalidateTag('solution')
		return { success: true }
	} catch (error) {
		log.error('solution.delete.error', {
			error,
			solutionId,
			userId: user.id,
		})
		throw error
	}
}

/**
 * Get the parent lesson for a solution
 */
export async function getLessonForSolution(solutionId: string) {
	try {
		// Find the resource join that links this solution to its lesson
		const resourceJoin = await db.query.contentResourceResource.findFirst({
			where: and(
				eq(contentResourceResource.resourceId, solutionId),
				isNull(contentResourceResource.deletedAt),
			),
			with: {
				resourceOf: true,
			},
		})

		if (
			!resourceJoin?.resourceOf ||
			resourceJoin.resourceOf.type !== 'lesson' ||
			resourceJoin.resourceOf.deletedAt
		) {
			return null
		}

		return resourceJoin.resourceOf
	} catch (error) {
		log.error('solutions.getLessonForSolution.error', {
			error,
			solutionId,
		})
		return null
	}
}
