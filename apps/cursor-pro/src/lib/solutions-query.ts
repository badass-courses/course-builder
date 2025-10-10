'use server'

import { revalidateTag } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import {
	contentResource,
	contentResourceResource,
	contentResourceVersion as contentResourceVersionTable,
} from '@/db/schema'
import { generateContentHash } from '@/lib/post-utils'
import {
	NewSolutionInputSchema,
	Solution,
	SolutionSchema,
	type NewSolutionInput,
	type SolutionUpdate,
} from '@/lib/solution'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { and, asc, desc, eq, isNull, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import { ContentResourceSchema } from '@coursebuilder/core/schemas'
import { VideoResourceSchema } from '@coursebuilder/core/schemas/video-resource'

import { deletePostInTypeSense, upsertPostToTypeSense } from './typesense-query'

/**
 * Get a solution for a specific lesson
 */
export async function getSolutionForLesson(lessonId: string) {
	log.info('solution.getForLesson', { lessonId })

	// Use a direct SQL query to get the solution linked to the lesson
	const query = sql`
		SELECT s.*
		FROM ${contentResource} AS s
		JOIN ${contentResourceResource} AS crr ON s.id = crr.resourceId
		WHERE crr.resourceOfId = ${lessonId}
		  AND s.type = 'solution'
		  AND s.deletedAt IS NULL
		  AND crr.deletedAt IS NULL
		LIMIT 1;
	`

	try {
		const result = await db.execute(query)

		if (!result.rows.length) {
			log.error('solution.getForLesson.error', {
				lessonId,
				error: 'No solution found',
			})
			return null
		}

		// Get the full solution with its resources
		// Type assertion to handle the SQL result properly
		const solutionId = (result.rows[0] as { id: string }).id

		const solution = await db.query.contentResource.findFirst({
			where: and(
				eq(contentResource.id, solutionId),
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

		if (!solution) return null

		return SolutionSchema.parse(solution)
	} catch (error) {
		log.error('solution.getForLesson.error', {
			error,
			lessonId,
		})
		return null
	}
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
		with: {
			resources: {
				where: isNull(contentResourceResource.deletedAt),
				with: {
					resource: true,
				},
			},
		},
	})

	if (!solution) {
		return null
	}

	const parsedSolution = SolutionSchema.safeParse(solution)
	if (!parsedSolution.success) {
		log.error('solution.parse.error', {
			error: parsedSolution.error,
			solutionId: solution.id,
		})
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
		} as any)

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

		try {
			await upsertPostToTypeSense(solution, 'save')
			await log.info('solution.typesense.indexed', {
				solutionId: solution.id,
				action: 'save',
			})
		} catch (error) {
			await log.error('solution.typesense.index.failed', {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				solutionId: solution.id,
			})
		}

		revalidateTag('solution', 'max')
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

	try {
		const updatedResource =
			await courseBuilderAdapter.updateContentResourceFields({
				id: currentSolution.id,
				fields: {
					...currentSolution.fields,
					...input.fields,
					slug: solutionSlug,
				},
			})

		try {
			await upsertPostToTypeSense(
				{
					...currentSolution,
					fields: {
						...currentSolution.fields,
						...input.fields,
						slug: solutionSlug,
					},
				},
				'save',
			)
			await log.info('solution.update.typesense.success', {
				solutionId: currentSolution.id,
				userId: user.id,
			})
		} catch (error) {
			await log.error('solution.update.typesense.failed', {
				solutionId: currentSolution.id,
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				userId: user.id,
			})
		}

		log.info('solution.updated', {
			solutionId: currentSolution.id,
			userId: user.id,
		})

		revalidateTag('solution', 'max')
		return updatedResource
	} catch (error) {
		log.error('solution.update.error', {
			error,
			solutionId: currentSolution.id,
			userId: user.id,
		})
		throw error
	}
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

		try {
			await deletePostInTypeSense(solutionId)
			await log.info('solution.delete.typesense.success', { solutionId })
		} catch (error) {
			await log.error('solution.delete.typesense.failed', {
				solutionId,
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			})
		}

		log.info('solution.deleted', {
			solutionId,
			lessonId: resourceJoin.resourceOfId,
			userId: user.id,
		})

		revalidateTag('solution', 'max')
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

/**
 * Connect a video resource to a solution
 */
export const addVideoResourceToSolution = async ({
	videoResourceId,
	solutionId,
}: {
	videoResourceId: string
	solutionId: string
}) => {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	// Get the video resource
	const videoResource = await db.query.contentResource.findFirst({
		where: and(
			eq(contentResource.id, videoResourceId),
			eq(contentResource.type, 'videoResource'),
		),
		with: {
			resources: true,
		},
	})

	// Get the solution
	const solution = await db.query.contentResource.findFirst({
		where: and(
			eq(contentResource.id, solutionId),
			eq(contentResource.type, 'solution'),
		),
		with: {
			resources: true,
		},
	})

	if (!solution) {
		throw new Error(`Solution with id ${solutionId} not found`)
	}

	if (!videoResource) {
		throw new Error(`Video Resource with id ${videoResourceId} not found`)
	}

	// Create the resource join
	await db.insert(contentResourceResource).values({
		resourceOfId: solution.id,
		resourceId: videoResource.id,
		position: solution.resources.length,
	})

	log.info('solution.video.connected', {
		solutionId: solution.id,
		videoResourceId,
		userId: user.id,
	})

	return db.query.contentResourceResource.findFirst({
		where: and(
			eq(contentResourceResource.resourceOfId, solution.id),
			eq(contentResourceResource.resourceId, videoResource.id),
		),
		with: {
			resource: true,
		},
	})
}

/**
 * Get the video resource for a solution
 * Uses the resource join table to find the associated video resource
 */
export const getVideoResourceForSolution = async (solutionIdOrSlug: string) => {
	const query = sql`SELECT cr_video.*
		FROM ${contentResource} AS cr_solution
		JOIN ${contentResourceResource} AS crr ON cr_solution.id = crr.resourceOfId
		JOIN ${contentResource} AS cr_video ON crr.resourceId = cr_video.id
		WHERE (cr_solution.id = ${solutionIdOrSlug} OR JSON_UNQUOTE(JSON_EXTRACT(cr_solution.fields, '$.slug')) = ${solutionIdOrSlug})
			AND cr_video.type = 'videoResource'
			AND cr_solution.type = 'solution'
			AND cr_solution.deletedAt IS NULL
			AND crr.deletedAt IS NULL
		LIMIT 1;`

	try {
		const result = await db.execute(query)

		if (!result.rows.length) return null

		const videoResourceRow = ContentResourceSchema.parse(result.rows[0])

		const videoResource = {
			...videoResourceRow,
			...videoResourceRow.fields,
		}

		return VideoResourceSchema.parse(videoResource)
	} catch (error) {
		log.error('solutions.getVideoResourceForSolution.error', {
			error,
			solutionIdOrSlug,
		})
		return null
	}
}

export const writeSolutionUpdateToDatabase = async (
	solution: SolutionUpdate,
) => {
	console.log('📝 Starting solution update:', {
		solutionId: solution.id,
	})

	try {
		console.log('🔄 Updating solution fields in database')
		await courseBuilderAdapter.updateContentResourceFields({
			id: solution.id,
			fields: {
				...solution.fields,
			},
		})
		console.log('✅ Solution fields updated successfully')
	} catch (error) {
		console.error('❌ Error updating solution fields:', error)
		throw error
	}

	console.log('🔍 Fetching updated solution')
	const updatedSolutionRaw = await db.query.contentResource.findFirst({
		where: and(
			eq(contentResource.id, solution.id),
			eq(contentResource.type, 'solution'),
		),
		with: {
			resources: {
				with: {
					resource: true,
				},
				orderBy: asc(contentResourceResource.position),
			},
		},
	})

	console.log('🔄 Validating updated solution')
	const updatedSolution = SolutionSchema.safeParse(updatedSolutionRaw)

	if (!updatedSolution.success) {
		console.error('❌ Failed to validate updated solution:', {
			error: updatedSolution.error.format(),
		})
		throw new Error(`Invalid solution data after update for ${solution.id}`)
	}

	if (!updatedSolution.data) {
		console.error('❌ Updated solution not found:', solution.id)
		throw new Error(`Solution with id ${solution.id} not found after update.`)
	}

	try {
		await upsertPostToTypeSense(updatedSolution.data, 'save')
		console.log('✅ Successfully upserted solution to TypeSense')
	} catch (error) {
		console.error(
			'⚠️ TypeSense indexing failed but continuing with solution update:',
			{
				error,
				solutionId: solution.id,
				stack: error instanceof Error ? error.stack : undefined,
			},
		)
		// Don't rethrow - let the solution update succeed even if TypeSense fails
	}

	return updatedSolution.data
}

export async function writeNewSolutionToDatabase(input: NewSolutionInput) {
	console.log('📝 Starting creating new solution', { input })

	try {
		console.log('🔍 Validating input:', input)
		const validatedInput = NewSolutionInputSchema.parse(input)
		const { title, parentLessonId, body, slug, description } = validatedInput
		console.log('✅ Input validated:', validatedInput)

		const solutionGuid = guid()
		const newSolutionId = `solution_${solutionGuid}`
		console.log('📝 Generated solution ID:', newSolutionId)

		try {
			// Step 1: Create the core solution
			console.log('📝 Creating core solution...')
			const solution = await courseBuilderAdapter.createContentResource({
				id: newSolutionId,
				type: 'solution',
				fields: {
					title,
					body: body || '',
					slug: slug || `${slugify(title)}~${solutionGuid}`,
					description: description || '',
					state: 'draft',
					visibility: 'unlisted',
				},
				createdById: input.createdById,
			})
			console.log('✅ Core solution created:', solution)

			// Step 2: Create the link between lesson and solution
			console.log('🔗 Creating lesson-solution link...')
			await db.insert(contentResourceResource).values({
				resourceId: solution.id,
				resourceOfId: parentLessonId,
				position: 0,
			})
			console.log('✅ Lesson-solution link created')

			try {
				await upsertPostToTypeSense(solution, 'save')
				console.log('✅ Successfully indexed solution in TypeSense')
			} catch (error) {
				console.error('⚠️ Failed to index solution in TypeSense:', {
					error,
					solutionId: solution.id,
					stack: error instanceof Error ? error.stack : undefined,
				})
				// Don't rethrow - let the solution creation succeed even if TypeSense fails
			}

			revalidateTag('solution', 'max')
			return solution
		} catch (error) {
			console.log('❌ Error in solution creation flow:', error)
			throw new Error(
				'Failed to create solution: ' +
					(error instanceof Error ? error.message : String(error)),
			)
		}
	} catch (error) {
		console.log('❌ Error in input validation:', error)
		if (error instanceof z.ZodError) {
			throw new Error('Invalid input for solution creation: ' + error.message)
		}
		throw error
	}
}

export async function deleteSolutionFromDatabase(solutionId: string) {
	try {
		await db.delete(contentResource).where(eq(contentResource.id, solutionId))

		await db
			.delete(contentResourceResource)
			.where(eq(contentResourceResource.resourceId, solutionId))

		try {
			await deletePostInTypeSense(solutionId)
			console.log('✅ Successfully deleted solution from TypeSense')
		} catch (error) {
			console.error('⚠️ Failed to delete solution from TypeSense:', {
				error,
				solutionId: solutionId,
				stack: error instanceof Error ? error.stack : undefined,
			})
			// Continue with database deletion even if TypeSense fails
		}
	} catch (error) {
		console.error('❌ Failed to delete solution from database:', {
			error,
			solutionId: solutionId,
		})
		throw error
	}
}
