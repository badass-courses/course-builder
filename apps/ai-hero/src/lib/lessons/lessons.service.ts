import { revalidatePath } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import {
	contentResource,
	contentResourceResource,
	contentResourceTag,
} from '@/db/schema'
import {
	LessonActionSchema,
	LessonSchema,
	LessonUpdateSchema,
	NewLessonInputSchema,
	type LessonAction,
} from '@/lib/lessons'
import { Ability, subject } from '@casl/ability'
import { and, asc, eq, inArray, or, sql } from 'drizzle-orm'

import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

import {
	deleteLessonFromDatabase,
	getAllLessons,
	writeLessonUpdateToDatabase,
	writeNewLessonToDatabase,
} from '../lessons-query'
import {
	deletePostInTypeSense,
	upsertPostToTypeSense,
} from '../typesense-query'
import { getWorkshopsForLesson } from '../workshops-query'

export class LessonError extends Error {
	constructor(
		message: string,
		public statusCode: number = 400,
		public details?: unknown,
	) {
		super(message)
	}
}

export async function getLesson(slugOrId: string, ability: Ability) {
	console.log('🔍 Querying lesson with slugOrId:', slugOrId)

	const visibility: ('public' | 'private' | 'unlisted')[] = ability.can(
		'update',
		'Content',
	)
		? ['public', 'private', 'unlisted']
		: ['public', 'unlisted']
	const states: ('draft' | 'published')[] = ability.can('update', 'Content')
		? ['draft', 'published']
		: ['published']

	const lesson = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`, slugOrId),
				eq(contentResource.id, slugOrId),
				eq(contentResource.id, `lesson_${slugOrId.split('~')[1]}`),
			),
			eq(contentResource.type, 'lesson'),
			inArray(
				sql`JSON_EXTRACT (${contentResource.fields}, "$.visibility")`,
				visibility,
			),
			inArray(sql`JSON_EXTRACT (${contentResource.fields}, "$.state")`, states),
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
				orderBy: asc(contentResourceTag.position),
			},
		},
	})

	if (!lesson) {
		console.log('❌ No lesson found for slugOrId:', slugOrId)
		return null
	}

	const lessonParsed = LessonSchema.safeParse(lesson)
	if (!lessonParsed.success) {
		console.error('❌ Error parsing lesson:', lessonParsed.error)
		throw new LessonError(
			'Invalid lesson data in database',
			500,
			lessonParsed.error,
		)
	}

	console.log('✅ Lesson found:', lessonParsed.data.id)

	const parentResources = await getWorkshopsForLesson(lessonParsed.data.id)
	console.log('✅ Retrieved parent resources')

	return {
		...lessonParsed.data,
		parentResources,
	}
}

// New function that doesn't require session
export async function getLessonById({
	id,
	ability,
}: {
	id: string
	ability: Ability
}) {
	console.log('🔍 Getting lesson by ID:', id)
	const lesson = await getLesson(id, ability)

	if (!lesson) {
		console.log('❌ Lesson not found:', id)
		throw new LessonError('Lesson not found', 404)
	}

	if (ability.cannot('read', subject('Content', lesson))) {
		console.log('❌ User lacks permission to read lesson:', id)
		throw new LessonError('Unauthorized', 401)
	}

	console.log('✅ Lesson retrieved:', lesson)
	return lesson
}

export async function createLesson({
	data,
	userId,
	ability,
}: {
	data: any
	userId: string
	ability: Ability
}) {
	if (ability.cannot('create', 'Content')) {
		throw new LessonError('Unauthorized', 401)
	}

	const validatedData = NewLessonInputSchema.safeParse({
		...data,
		createdById: userId,
	})

	if (!validatedData.success) {
		throw new LessonError('Invalid input', 400, validatedData.error)
	}

	try {
		const lesson = await writeNewLessonToDatabase({
			title: validatedData.data.title,
			videoResourceId: validatedData.data.videoResourceId || undefined,
			lessonType: validatedData.data.lessonType,
			createdById: userId,
		})

		// Index in TypeSense
		try {
			console.log('🔍 Indexing new lesson in Typesense:', lesson.id)
			await upsertPostToTypeSense(lesson, 'save')
			console.log('✅ Lesson successfully indexed in Typesense')
		} catch (error) {
			console.error('⚠️ Failed to index lesson in Typesense:', {
				error,
				lessonId: lesson.id,
				stack: error instanceof Error ? error.stack : undefined,
			})
			// Continue even if TypeSense indexing fails
		}

		return lesson
	} catch (error) {
		throw new LessonError('Failed to create lesson', 500, error)
	}
}

export async function getLessons({
	userId,
	ability,
	slug,
}: {
	userId?: string
	ability: Ability
	slug?: string | null
}) {
	if (slug) {
		console.log('🔍 Getting lesson by slug:', slug)
		const lesson = await getLesson(slug, ability)

		if (!lesson) {
			console.log('❌ Lesson not found:', slug)
			throw new LessonError('Lesson not found', 404)
		}

		if (ability.cannot('read', subject('Content', lesson))) {
			console.log('❌ User lacks permission to read lesson:', slug)
			throw new LessonError('Unauthorized', 401)
		}

		console.log('✅ Lesson retrieved:', lesson.id)
		return lesson
	}

	if (ability.cannot('read', 'Content')) {
		throw new LessonError('Unauthorized', 401)
	}

	return getAllLessons()
}

export async function updateLesson({
	id,
	data,
	action,
	userId,
	ability,
}: {
	id: string
	data: unknown
	action: unknown
	userId: string
	ability: Ability
}) {
	console.log('🔄 Processing lesson update request:', {
		id,
		action,
		userId,
		dataKeys: data ? Object.keys(data as object) : [],
	})

	const actionResult = LessonActionSchema.safeParse(action || 'save')
	if (!actionResult.success) {
		console.error('❌ Invalid action:', {
			action,
			error: actionResult.error.format(),
		})
		throw new LessonError('Invalid action', 400, actionResult.error)
	}

	console.log('🔍 Fetching original lesson:', id)
	const originalLesson = await getLesson(id, ability)
	if (!originalLesson) {
		console.error('❌ Original lesson not found:', id)
		throw new LessonError('Lesson not found', 404)
	}

	console.log('🔐 Checking permissions')
	if (ability.cannot('manage', subject('Content', originalLesson))) {
		console.error('❌ User lacks permission:', {
			userId,
			lessonId: id,
			action: actionResult.data,
		})
		throw new LessonError('Unauthorized', 401)
	}

	// Handle state transitions for all actions
	const getNewState = (
		action: LessonAction,
	): 'draft' | 'published' | 'archived' | 'deleted' => {
		switch (action) {
			case 'publish':
				return 'published'
			case 'unpublish':
				return 'draft'
			case 'archive':
				return 'archived'
			default:
				return originalLesson.fields.state
		}
	}

	// For state-changing actions, use current lesson data with updated state
	const isStateChange = ['publish', 'unpublish', 'archive'].includes(
		actionResult.data,
	)
	const updateData = isStateChange
		? {
				id,
				fields: {
					...originalLesson.fields,
					state: getNewState(actionResult.data),
				},
			}
		: data

	console.log('🔍 Validating update data:', {
		action: actionResult.data,
		isStateChange,
		newState: isStateChange ? getNewState(actionResult.data) : undefined,
	})

	const validatedData = LessonUpdateSchema.safeParse(updateData)
	if (!validatedData.success) {
		console.error('❌ Invalid update data:', {
			error: validatedData.error.format(),
			data: updateData,
		})
		throw new LessonError('Invalid input', 400, validatedData.error)
	}

	try {
		console.log('📝 Writing update to database:', {
			id,
			action: actionResult.data,
			fields: Object.keys(validatedData.data?.fields || {}),
		})

		const result = await writeLessonUpdateToDatabase({
			currentLesson: originalLesson,
			lessonUpdate: validatedData.data,
			action: actionResult.data,
			updatedById: userId,
		})

		// Update in TypeSense
		try {
			console.log('🔍 Updating lesson in Typesense:', {
				lessonId: result.id,
				action: actionResult.data,
			})
			await upsertPostToTypeSense(result, actionResult.data)
			console.log('✅ Lesson successfully updated in Typesense')
		} catch (error) {
			console.error('⚠️ Failed to update lesson in Typesense:', {
				error,
				lessonId: result.id,
				action: actionResult.data,
				stack: error instanceof Error ? error.stack : undefined,
			})
			// Continue even if TypeSense update fails
		}

		console.log('✅ Update successful:', {
			id,
			action: actionResult.data,
			newState: result.fields.state,
		})
		console.log('🔄 Revalidating path:', `/${result.fields.slug}`)

		console.log('🔍 Getting parent resources (workshops) for lesson', result.id)
		let parentResources = null
		parentResources = await getWorkshopsForLesson(result.id)
		console.log('✅ Retrieved parent resources')
		if (parentResources.length > 0) {
			const lessonPath = getResourcePath('lesson', result.fields.slug, 'view', {
				parentType: parentResources[0]?.type as string,
				parentSlug: parentResources[0]?.fields?.slug as string,
			})
			console.log('🔍 Revalidating path:', lessonPath)
			revalidatePath(lessonPath)
		}

		return result
	} catch (error: any) {
		console.error('❌ Update failed:', {
			id,
			action: actionResult.data,
			error: error.message || error,
			stack: error.stack,
		})
		throw new LessonError('Failed to update lesson', 500, error)
	}
}

export async function deleteLesson({
	id,
	ability,
}: {
	id: string
	ability: Ability
}) {
	if (!id) {
		throw new LessonError('Missing lesson ID', 400)
	}

	const lessonToDelete = await courseBuilderAdapter.getContentResource(id)
	if (!lessonToDelete) {
		throw new LessonError('Lesson not found', 404)
	}

	if (ability.cannot('delete', subject('Content', lessonToDelete))) {
		throw new LessonError('Unauthorized', 401)
	}

	try {
		// Delete from database
		await deleteLessonFromDatabase(id)

		// Delete from TypeSense
		try {
			console.log('🔄 Deleting lesson from Typesense:', id)
			await deletePostInTypeSense(id)
			console.log('✅ Lesson successfully deleted from Typesense')
		} catch (error) {
			console.error('⚠️ Failed to delete lesson from Typesense:', {
				error,
				lessonId: id,
				stack: error instanceof Error ? error.stack : undefined,
			})
			// Continue even if TypeSense deletion fails
		}

		console.log('🔄 Revalidating path:', `/${lessonToDelete.fields?.slug}`)
		revalidatePath(`/${lessonToDelete.fields?.slug}`)

		return { message: 'Lesson deleted successfully' }
	} catch (error) {
		throw new LessonError('Failed to delete lesson', 500, error)
	}
}
