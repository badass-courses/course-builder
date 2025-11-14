'use server'

import { revalidateTag, unstable_cache } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import {
	contentResource,
	contentResourceResource,
	contentResourceTag,
} from '@/db/schema'
import { env } from '@/env.mjs'
import {
	LessonSchema,
	NewLessonInputSchema,
	type LessonUpdate,
	type NewLessonInput,
} from '@/lib/lessons'
import { upsertPostToTypeSense } from '@/lib/typesense-query'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { Redis } from '@upstash/redis'
import { and, asc, desc, eq, like, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import {
	ContentResourceSchema,
	type ContentResourceResource,
} from '@coursebuilder/core/schemas'
import { VideoResourceSchema } from '@coursebuilder/core/schemas/video-resource'
import { last } from '@coursebuilder/nodash'

import { Lesson } from './lessons'
import { SolutionSchema } from './solution'
import { getCachedSolution, getSolution } from './solutions-query'

const redis = Redis.fromEnv()

export const getLessonVideoTranscript = async (
	lessonIdOrSlug?: string | null,
) => {
	if (!lessonIdOrSlug) return null
	const query = sql`SELECT cr_video.fields->>'$.transcript' AS transcript
		FROM ${contentResource} AS cr_lesson
		JOIN ${contentResourceResource} AS crr ON cr_lesson.id = crr.resourceOfId
		JOIN ${contentResource} AS cr_video ON crr.resourceId = cr_video.id

		WHERE (cr_lesson.id = ${lessonIdOrSlug} OR JSON_UNQUOTE(JSON_EXTRACT(cr_lesson.fields, '$.slug')) = ${lessonIdOrSlug})
			AND cr_video.type = 'videoResource'
		LIMIT 1;`
	const result = await db.execute(query)

	const parsedResult = z
		.array(z.object({ transcript: z.string() }))
		.safeParse(result.rows)

	if (!parsedResult.success) {
		console.error('Error parsing transcript', parsedResult.error)
		return null
	}

	return parsedResult.data[0]?.transcript
}

export const getVideoResourceForLesson = async (lessonIdOrSlug: string) => {
	const query = sql`SELECT *
		FROM ${contentResource} AS cr_lesson
		JOIN ${contentResourceResource} AS crr ON cr_lesson.id = crr.resourceOfId
		JOIN ${contentResource} AS cr_video ON crr.resourceId = cr_video.id
		WHERE (cr_lesson.id = ${lessonIdOrSlug} OR JSON_UNQUOTE(JSON_EXTRACT(cr_lesson.fields, '$.slug')) = ${lessonIdOrSlug})
			AND cr_video.type = 'videoResource'
		LIMIT 1;`

	const result = await db.execute(query)

	if (!result.rows.length) return null

	const videoResourceRow = ContentResourceSchema.parse(result.rows[0])

	const videoResource = {
		...videoResourceRow,
		...videoResourceRow.fields,
	}

	return VideoResourceSchema.parse(videoResource)
}

export const getLessonMuxPlaybackId = async (lessonIdOrSlug: string) => {
	const query = sql`SELECT cr_video.fields->>'$.muxPlaybackId' AS muxPlaybackId
		FROM ${contentResource} AS cr_lesson
		JOIN ${contentResourceResource} AS crr ON cr_lesson.id = crr.resourceOfId
		JOIN ${contentResource} AS cr_video ON crr.resourceId = cr_video.id
		WHERE (cr_lesson.id = ${lessonIdOrSlug} OR JSON_UNQUOTE(JSON_EXTRACT(cr_lesson.fields, '$.slug')) = ${lessonIdOrSlug})
			AND cr_video.type = 'videoResource'
		LIMIT 1;`
	const result = await db.execute(query)

	const parsedResult = z
		.array(z.object({ muxPlaybackId: z.string() }))
		.safeParse(result.rows)

	if (!parsedResult.success) {
		console.error('Error parsing muxPlaybackId', parsedResult.error)
		return null
	}

	return parsedResult.data[0]?.muxPlaybackId
}

export const addVideoResourceToLesson = async ({
	videoResourceId,
	lessonId,
}: {
	videoResourceId: string
	lessonId: string
}) => {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const videoResource = await db.query.contentResource.findFirst({
		where: and(
			eq(contentResource.id, videoResourceId),
			eq(contentResource.type, 'videoResource'),
		),
		with: {
			resources: true,
		},
	})

	const lesson = await db.query.contentResource.findFirst({
		where: and(
			like(contentResource.id, `%${last(lessonId.split('-'))}%`),
			or(
				eq(contentResource.type, 'lesson'),
				eq(contentResource.type, 'exercise'),
				eq(contentResource.type, 'solution'),
			),
		),
		with: {
			resources: true,
		},
	})

	if (!lesson) {
		throw new Error(`Lesson with id ${lessonId} not found`)
	}

	if (!videoResource) {
		throw new Error(`Video Resource with id ${videoResourceId} not found`)
	}

	await db.insert(contentResourceResource).values({
		resourceOfId: lesson.id,
		resourceId: videoResource.id,
		position: lesson.resources.length,
	})

	return db.query.contentResourceResource.findFirst({
		where: and(
			eq(contentResourceResource.resourceOfId, lesson.id),
			eq(contentResourceResource.resourceId, videoResource.id),
		),
		with: {
			resource: true,
		},
	})
}

export const getCachedLesson = unstable_cache(
	async (slug: string) => getLesson(slug),
	['lesson'],
	{ revalidate: 3600, tags: ['lesson'] },
)

export async function getLesson(lessonSlugOrId: string) {
	// const start = new Date().getTime()

	const cachedLesson = await redis.get(
		`lesson:${env.NEXT_PUBLIC_APP_NAME}:${lessonSlugOrId}`,
	)

	const lesson = cachedLesson
		? cachedLesson
		: await db.query.contentResource.findFirst({
				where: and(
					or(
						eq(
							sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
							lessonSlugOrId,
						),
						eq(contentResource.id, lessonSlugOrId),
						like(contentResource.id, `%${last(lessonSlugOrId.split('-'))}%`),
					),
					or(
						eq(contentResource.type, 'lesson'),
						eq(contentResource.type, 'exercise'),
						eq(contentResource.type, 'solution'),
						eq(contentResource.type, 'post'),
					),
				),
				with: {
					tags: {
						with: {
							tag: true,
						},
						orderBy: asc(contentResourceTag.position),
					},
					resources: {
						with: {
							resource: {
								columns: {
									type: true,
								},
							},
						},
					},
				},
			})

	const parsedLesson = LessonSchema.safeParse(lesson)
	if (!parsedLesson.success) {
		console.error('Error parsing lesson', lesson, parsedLesson.error)
		return null
	}

	if (!cachedLesson) {
		await redis.set(
			`lesson:${env.NEXT_PUBLIC_APP_NAME}:${lessonSlugOrId}`,
			lesson,
			{ ex: 10 },
		)
	}

	// console.log('getLesson end', { lessonSlugOrId }, new Date().getTime() - start)

	return parsedLesson.data
}

export const getCachedExerciseSolution = unstable_cache(
	async (slug: string) => getExerciseSolution(slug),
	['solution'],
	{ revalidate: 3600, tags: ['solution'] },
)

export async function getExerciseSolution(lessonSlugOrId: string) {
	const lesson = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(
					sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
					lessonSlugOrId,
				),
				eq(contentResource.id, lessonSlugOrId),
			),
			or(
				eq(contentResource.type, 'lesson'),
				eq(contentResource.type, 'exercise'),
				eq(contentResource.type, 'solution'),
			),
		),
		with: {
			resources: {
				with: {
					resource: {
						columns: {
							type: true,
							id: true,
						},
					},
				},
				orderBy: asc(contentResourceResource.position),
			},
		},
	})

	const parsedLesson = LessonSchema.safeParse(lesson)
	if (!parsedLesson.success) {
		console.error('Error parsing lesson', lesson)
		return null
	}

	const partialSolution = parsedLesson.data?.resources?.find(
		(resource: ContentResourceResource) =>
			resource.resource.type === 'solution',
	)?.resource

	const solution = await getCachedSolution(partialSolution.id)

	const parsedSolution = SolutionSchema.safeParse(solution)
	if (!parsedSolution.success) {
		console.error('Error parsing solution', solution)
		return null
	}
	return { solution: parsedSolution.data, lesson: parsedLesson.data }
}

export async function updateLesson(input: LessonUpdate, revalidate = true) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('update', 'Content')) {
		throw new Error('Unauthorized')
	}

	// Ensure we have an ID to look up
	const id = input.id
	if (!id) {
		throw new Error('Lesson ID is required for updates')
	}

	const currentLesson = await getLesson(id)

	if (!currentLesson) {
		throw new Error(`Lesson with id ${id} not found.`)
	}

	let lessonSlug = currentLesson.fields.slug

	// Handle both PostUpdate and Lesson formats
	let titleFromInput: string | undefined
	let fieldsToUpdate: Record<string, any> = {}

	// Safely extract fields regardless of input type
	if (input.fields) {
		fieldsToUpdate = input.fields
		titleFromInput = input.fields.title
	}

	if (titleFromInput && titleFromInput !== currentLesson.fields.title) {
		const splitSlug = currentLesson?.fields.slug.split('~') || ['', guid()]
		lessonSlug = `${slugify(titleFromInput)}~${splitSlug[1] || guid()}`
	}

	const updatedLesson = {
		...currentLesson,
		fields: {
			...currentLesson.fields,
			...fieldsToUpdate,
			slug: lessonSlug,
		},
	}

	// Update the lesson
	const updatedResource = courseBuilderAdapter.updateContentResourceFields({
		id: currentLesson.id,
		fields: updatedLesson.fields,
	})

	// Index the lesson in Typesense using the existing post indexing function
	try {
		await upsertPostToTypeSense(updatedLesson, 'save')
		console.log('🔍 Lesson updated in Typesense')
	} catch (error) {
		console.log('❌ Error updating lesson in Typesense', error)
	}

	if (revalidate) {
		revalidateTag('lesson', 'max')
	}

	return updatedResource
}

export async function autoUpdateLesson(input: LessonUpdate) {
	return await updateLesson(input, false)
}

export async function getAllLessonsForUser(userId?: string): Promise<Lesson[]> {
	if (!userId) {
		return []
	}

	const lessons = await db.query.contentResource.findMany({
		where: and(
			eq(contentResource.type, 'lesson'),
			eq(contentResource.createdById, userId),
		),
		with: {
			tags: {
				with: {
					tag: true,
				},
				orderBy: asc(contentResourceResource.position),
			},
			resources: {
				with: {
					resource: true,
				},
				orderBy: asc(contentResourceResource.position),
			},
		},
		orderBy: desc(contentResource.createdAt),
	})

	const lessonsParsed = z.array(LessonSchema).safeParse(lessons)
	if (!lessonsParsed.success) {
		console.error('Error parsing lessons', lessonsParsed.error)
		return []
	}

	return lessonsParsed.data
}

export async function writeNewLessonToDatabase(
	input: NewLessonInput,
): Promise<Lesson> {
	try {
		console.log('🔍 Validating input:', input)
		const validatedInput = NewLessonInputSchema.parse(input)
		const { title, videoResourceId, lessonType, createdById } = validatedInput
		console.log('✅ Input validated:', validatedInput)

		const lessonGuid = guid()
		const newLessonId = `lesson_${lessonGuid}`
		console.log('📝 Generated lesson ID:', newLessonId)

		// Step 1: Get video resource if needed
		let videoResource = null
		if (videoResourceId) {
			console.log('🎥 Fetching video resource:', videoResourceId)
			videoResource =
				await courseBuilderAdapter.getVideoResource(videoResourceId)
			console.log('✅ Video resource fetched:', videoResource)
		}

		try {
			// Wrap database operations in a transaction
			const lesson = await db.transaction(async (tx) => {
				// Step 2: Create the core lesson
				console.log('📝 Creating core lesson...')
				const lesson = await createCoreLesson({
					newLessonId,
					title,
					lessonGuid,
					lessonType,
					createdById,
					tx, // Pass transaction context
				})
				console.log('✅ Core lesson created:', lesson)

				// Step 3: Link video resource if provided
				if (videoResourceId) {
					console.log('🔗 Linking video resource to lesson...')
					await tx.insert(contentResourceResource).values({
						resourceOfId: lesson.id,
						resourceId: videoResourceId,
						position: 0,
					})
					console.log('✅ Video resource linked to lesson')
				}

				return lesson
			})

			// Step 4: Index the lesson in Typesense (outside transaction since it's a separate system)
			try {
				console.log('🔍 Indexing lesson in Typesense')
				await upsertPostToTypeSense(lesson, 'save')
				console.log('✅ Lesson indexed in Typesense')
			} catch (error) {
				console.error('⚠️ Failed to index lesson in Typesense:', {
					error,
					lessonId: lesson.id,
					stack: (error as Error).stack,
				})
				// Continue even if TypeSense indexing fails
			}

			return lesson
		} catch (error) {
			console.log('❌ Error in lesson creation flow:', error)
			throw new Error(
				'Failed to create lesson: ' +
					(error instanceof Error ? error.message : String(error)),
			)
		}
	} catch (error) {
		console.log('❌ Error in input validation:', error)
		if (error instanceof z.ZodError) {
			throw new Error('Invalid input for lesson creation: ' + error.message)
		}
		throw error
	}
}

// Helper function that accepts transaction context
async function createCoreLesson({
	newLessonId,
	title,
	lessonGuid,
	lessonType,
	createdById,
	tx,
}: {
	newLessonId: string
	title: string
	lessonGuid: string
	lessonType: string
	createdById: string
	tx?: any // Transaction context
}): Promise<Lesson> {
	try {
		console.log('📝 Creating core lesson with:', {
			newLessonId,
			title,
			lessonGuid,
			lessonType,
			createdById,
		})

		const dbContext = tx || db // Use transaction context if provided, otherwise use db

		await dbContext.insert(contentResource).values({
			id: newLessonId,
			type: 'lesson',
			createdById,
			fields: {
				title,
				state: 'draft',
				visibility: 'unlisted',
				slug: `${slugify(title)}~${lessonGuid}`,
				lessonType,
			},
		})
		console.log('✅ Lesson inserted into database')

		// Direct query by ID without filters
		const lesson = await dbContext.query.contentResource.findFirst({
			where: eq(contentResource.id, newLessonId),
			with: {
				resources: {
					with: {
						resource: true,
					},
					orderBy: asc(contentResourceResource.position),
				},
				tags: {
					with: {
						tag: true,
					},
				},
			},
		})
		console.log('🔍 Retrieved lesson after creation:', lesson)

		if (!lesson) {
			console.log('❌ Lesson not found after creation')
			throw new Error('Lesson not found after creation')
		}

		const lessonParsed = LessonSchema.safeParse(lesson)
		if (!lessonParsed.success) {
			console.log('❌ Error parsing lesson:', lessonParsed.error)
			throw new Error('Invalid lesson data')
		}

		return lessonParsed.data
	} catch (error) {
		console.log('❌ Error in createCoreLesson:', error)
		throw new Error(
			'Failed to create core lesson: ' +
				(error instanceof Error ? error.message : String(error)),
		)
	}
}

export async function writeLessonUpdateToDatabase(input: {
	currentLesson?: Lesson
	lessonUpdate: LessonUpdate
	action: 'save' | 'publish' | 'unpublish' | 'archive'
	updatedById: string
}) {
	const {
		currentLesson = await getLesson(input.lessonUpdate.id),
		lessonUpdate,
		action = 'save',
		updatedById,
	} = input

	console.log('📝 Starting lesson update:', {
		lessonId: lessonUpdate.id,
		action,
		updatedById,
		hasCurrentLesson: !!currentLesson,
		updateFields: lessonUpdate.fields ? Object.keys(lessonUpdate.fields) : [],
	})

	if (!currentLesson) {
		console.error('❌ Current lesson not found:', lessonUpdate.id)
		throw new Error(`Lesson with id ${input.lessonUpdate.id} not found.`)
	}

	if (lessonUpdate.fields?.title === '') {
		console.error('❌ Title is required for update')
		throw new Error('Title is required')
	}

	let lessonSlug = currentLesson.fields.slug

	if (
		lessonUpdate.fields?.title &&
		lessonUpdate.fields.title !== currentLesson.fields.title
	) {
		const splitSlug = currentLesson?.fields.slug.split('~') || ['', guid()]
		lessonSlug = `${slugify(lessonUpdate.fields.title)}~${splitSlug[1] || guid()}`
		console.log('🔄 Updating slug:', {
			oldSlug: currentLesson.fields.slug,
			newSlug: lessonSlug,
		})
	}

	try {
		console.log('🔄 Updating lesson fields in database')
		await courseBuilderAdapter.updateContentResourceFields({
			id: currentLesson.id,
			fields: {
				...currentLesson.fields,
				...lessonUpdate.fields,
				slug: lessonSlug,
			},
		})
		console.log('✅ Lesson fields updated successfully')
	} catch (error) {
		console.error('❌ Error updating lesson fields:', error)
		throw error
	}

	console.log('🔍 Fetching updated lesson')
	const updatedLessonRaw = await db.query.contentResource.findFirst({
		where: and(
			eq(contentResource.id, currentLesson.id),
			eq(contentResource.type, 'lesson'),
		),
		with: {
			resources: {
				with: {
					resource: true,
				},
				orderBy: asc(contentResourceResource.position),
			},
			tags: {
				with: {
					tag: true,
				},
			},
		},
	})

	console.log('🔄 Validating updated lesson')
	const updatedLesson = LessonSchema.safeParse(updatedLessonRaw)

	if (!updatedLesson.success) {
		console.error('❌ Failed to validate updated lesson:', {
			error: updatedLesson.error.format(),
		})
		throw new Error(`Invalid lesson data after update for ${currentLesson.id}`)
	}

	if (!updatedLesson.data) {
		console.error('❌ Updated lesson not found:', currentLesson.id)
		throw new Error(
			`Lesson with id ${currentLesson.id} not found after update.`,
		)
	}

	// Index the lesson in Typesense
	try {
		console.log('🔍 Upserting lesson to Typesense:', {
			lessonId: updatedLesson.data.id,
			action,
		})
		await upsertPostToTypeSense(updatedLesson.data, action)
		console.log('✅ Successfully upserted lesson to TypeSense')
	} catch (error) {
		console.error(
			'⚠️ TypeSense indexing failed but continuing with lesson update:',
			{
				error,
				lessonId: updatedLesson.data.id,
				action,
				stack: (error as Error).stack,
			},
		)
		// Don't rethrow - let the lesson update succeed even if TypeSense fails
	}

	return updatedLesson.data
}

export async function deleteLessonFromDatabase(id: string) {
	await log.info('lesson.delete.started', { lessonId: id })

	try {
		const rawLesson = await db.query.contentResource.findFirst({
			where: and(
				eq(contentResource.id, id),
				eq(contentResource.type, 'lesson'),
			),
			with: {
				resources: {
					with: {
						resource: true,
					},
					orderBy: asc(contentResourceResource.position),
				},
				tags: {
					with: {
						tag: true,
					},
				},
			},
		})

		const lesson = LessonSchema.nullish().safeParse(rawLesson)

		if (!lesson.success || !lesson.data) {
			await log.error('lesson.delete.notfound', {
				lessonId: id,
				parseError: lesson.success ? undefined : lesson.error.format(),
			})
			throw new Error(`Lesson with id ${id} not found or invalid.`)
		}

		await log.info('lesson.delete.resources.started', {
			lessonId: id,
			resourceCount: lesson.data.resources?.length,
		})

		// Delete lesson resources
		await db
			.delete(contentResourceResource)
			.where(eq(contentResourceResource.resourceOfId, id))

		// Delete the lesson itself
		await log.info('lesson.delete.content.started', { lessonId: id })
		await db.delete(contentResource).where(eq(contentResource.id, id))

		await log.info('lesson.delete.completed', { lessonId: id })
		return true
	} catch (error) {
		await log.error('lesson.delete.failed', {
			lessonId: id,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		})
		throw error
	}
}
