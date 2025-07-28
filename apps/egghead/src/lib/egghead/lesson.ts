'use server'

import { eggheadPgQuery } from '@/db/eggheadPostgres'
import { EggheadApiError } from '@/errors/egghead-api-error'
import { EGGHEAD_LESSON_CREATED_EVENT } from '@/inngest/events/egghead/lesson-created'
import { inngest } from '@/inngest/inngest.server'
import { getPost } from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'

import { getEggheadToken, getEggheadUserProfile } from './auth'
import {
	EGGHEAD_API_V1_BASE_URL,
	EggheadLessonState,
	EggheadLessonVisibilityState,
} from './types'

/**
 * Type constants for Egghead lessons
 */
const EGGHEAD_LESSON_TYPE = 'lesson'
const EGGHEAD_INITIAL_LESSON_STATE = 'approved'

/**
 * Creates a new lesson in the Egghead API
 * @param input - The lesson creation input
 * @returns The ID of the created lesson
 */
export async function createEggheadLesson(input: {
	title: string
	slug: string
	guid: string
	instructorId: string | number
	hlsUrl?: string
}) {
	const { title, slug, guid, instructorId, hlsUrl = null } = input

	const columns = [
		'title',
		'instructor_id',
		'slug',
		'resource_type',
		'state',
		'created_at',
		'updated_at',
		'visibility_state',
		'guid',
		'is_pro_content',
		'free_forever',
		...(hlsUrl ? ['current_video_hls_url'] : []),
	]

	const values = [
		title,
		instructorId,
		slug,
		EGGHEAD_LESSON_TYPE,
		EGGHEAD_INITIAL_LESSON_STATE,
		new Date(), // created_at
		new Date(), // updated_at
		'hidden',
		guid,
		'true',
		'false',
		...(hlsUrl ? [hlsUrl] : []),
	]

	const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ')

	const query = `
		INSERT INTO lessons (${columns.join(', ')})
		VALUES (${placeholders})
		RETURNING id
	`

	const eggheadLessonResult = await eggheadPgQuery(query, values)

	const eggheadLessonId = eggheadLessonResult.rows[0].id

	await inngest.send({
		name: EGGHEAD_LESSON_CREATED_EVENT,
		data: {
			id: eggheadLessonId,
		},
	})

	return eggheadLessonId
}

/**
 * Updates an existing lesson in the Egghead API
 * @param input - The lesson update input
 */
export async function updateEggheadLesson(input: {
	eggheadLessonId: number
	title: string
	slug: string
	guid: string
	published: boolean
	state: string
	visibilityState: string
	access: boolean
	duration: number
	hlsUrl?: string
	body?: string
	ogImageUrl?: string
}) {
	const {
		eggheadLessonId,
		published,
		state,
		visibilityState,
		access,
		duration,
		hlsUrl = null,
		title,
		slug,
		guid,
		body = '',
		ogImageUrl = null,
	} = input
	await eggheadPgQuery(
		`UPDATE lessons SET
			state = $1,
			duration = $2,
			updated_at = NOW(),
			visibility_state = $3,
			current_video_hls_url = $4,
			title = $5,
			slug = $6,
			guid = $7,
			summary = $8,
      is_pro_content = $10,
      free_forever = NOT $10,
      published = $11,
      og_image_url = $12
		WHERE id = $9`,
		[
			state,
			Math.floor(duration),
			visibilityState,
			hlsUrl,
			title,
			slug,
			guid,
			body,
			eggheadLessonId,
			access,
			published,
			ogImageUrl,
		],
	)
}

/**
 * Sets the published_at timestamp for a lesson
 * @param eggheadLessonId - The Egghead lesson ID
 * @param publishedAt - The published timestamp
 */
export async function setLessonPublishedAt(
	eggheadLessonId: number,
	publishedAt: string,
) {
	return eggheadPgQuery(`UPDATE lessons SET published_at = $1 WHERE id = $2`, [
		publishedAt,
		eggheadLessonId,
	])
}

/**
 * Clears the published_at timestamp for a lesson
 * @param eggheadLessonId - The Egghead lesson ID
 */
export async function clearLessonPublishedAt(eggheadLessonId: number) {
	return eggheadPgQuery(
		`UPDATE lessons SET published_at = NULL WHERE id = $1`,
		[eggheadLessonId],
	)
}

/**
 * Syncs an Egghead resource instructor with a given instructor ID
 * @param postId - The post ID to update
 * @param userId - The user ID of the instructor
 */
export async function syncEggheadResourceInstructor(
	postId: string,
	userId: string,
) {
	const { ability, session } = await getServerAuthSession()

	if (!session?.user?.id || ability.cannot('manage', 'all')) {
		throw new Error('Unauthorized')
	}
	const eggheadToken = await getEggheadToken(session.user.id)

	const post = await getPost(postId)

	if (!post) {
		throw new Error(`Post with id ${postId} not found.`)
	}

	const eggheadUser = await getEggheadUserProfile(userId)

	if (!eggheadUser || !eggheadUser.instructor?.id) {
		throw new Error(`egghead instructor for user ${userId} not found.`)
	}

	switch (post.fields.postType) {
		case 'lesson':
			if (!post.fields.eggheadLessonId) {
				throw new Error(
					`eggheadLessonId is required on ${post.id} to sync egghead instructor`,
				)
			}

			await fetch(
				`${EGGHEAD_API_V1_BASE_URL}/lessons/${post.fields.eggheadLessonId}`,
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${eggheadToken}`,
						'User-Agent': 'authjs',
					},
					body: JSON.stringify({
						lesson: {
							instructor_id: eggheadUser.instructor.id,
						},
					}),
				},
			).then((res) => {
				if (!res.ok) {
					throw new EggheadApiError(
						`Failed to sync egghead instructor for ${post.id}, status: ${res.status}, text: ${res.statusText}`,
					)
				}

				return res.json()
			})
			break
	}
}

/**
 * Gets a lesson from the Egghead API by its ID
 * @param eggheadLessonId - The Egghead lesson ID
 * @returns The Egghead lesson data
 */
export async function getEggheadLesson(eggheadLessonId: number) {
	const response = await fetch(
		`https://app.egghead.io/api/v1/lessons/${eggheadLessonId}`,
	)

	if (!response.ok) {
		throw new Error(
			`Failed to fetch lesson: ${response.status} ${response.statusText}`,
		)
	}

	return response.json()
}

/**
 * Creates a new version of an Egghead lesson
 * @param eggheadLessonId - The Egghead lesson ID
 * @param versionNote - The version note
 */
export async function createEggheadLessonVersion(
	eggheadLessonId: number,
	versionNote: string,
) {
	const { ability, session } = await getServerAuthSession()

	if (!session?.user?.id || ability.cannot('manage', 'all')) {
		throw new Error('Unauthorized')
	}

	const eggheadUser = await getEggheadUserProfile(session?.user?.id)

	const columns = ['lesson_id', 'notes', 'user_id', 'created_at']

	const values = [eggheadLessonId, versionNote, eggheadUser.id, new Date()]

	const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ')

	const query = `
		INSERT INTO lesson_versions (${columns.join(', ')})
		VALUES (${placeholders})
		RETURNING id
	`
	const eggheadLessonVersionResult = await eggheadPgQuery(query, values)

	const eggheadLessonVersionId = eggheadLessonVersionResult.rows[0].id

	console.log('[createEggheadLessonVersion]', {
		eggheadLessonVersionId,
		eggheadLessonId,
	})

	await eggheadPgQuery(
		`UPDATE lessons SET
			current_lesson_version_id = $1
		WHERE id = $2`,
		[eggheadLessonVersionId, eggheadLessonId],
	)

	return eggheadLessonVersionId
}
