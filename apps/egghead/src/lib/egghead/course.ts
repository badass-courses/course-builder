'use server'

import { eggheadPgQuery } from '@/db/eggheadPostgres'
import { EggheadApiError } from '@/errors/egghead-api-error'
// Import these functions here to avoid circular dependencies
import { getPost } from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'
import slugify from '@sindresorhus/slugify'

import { getEggheadToken, getEggheadUserProfile } from './auth'
import { EGGHEAD_API_V1_BASE_URL, EggheadDbCourseSchema } from './types'

/**
 * Type constants for Egghead courses
 */
const EGGHEAD_INITIAL_COURSE_STATE = 'new'

/**
 * Creates a new course in the Egghead API
 * @param input - The course creation input
 * @returns The created Egghead course
 */
export async function createEggheadCourse(input: {
	title: string
	guid: string
	ownerId: number
}) {
	const { title, guid, ownerId } = input

	const columns = [
		'title',
		'owner_id',
		'slug',
		'guid',
		'shared_id',
		'state',
		'visibility_state',
		'created_at',
		'updated_at',
	]

	const slug = slugify(title) + `~${guid}`

	const values = [
		title,
		ownerId,
		slug,
		guid,
		guid,
		EGGHEAD_INITIAL_COURSE_STATE,
		'hidden',
		new Date(), // created_at
		new Date(), // updated_at
	]

	const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ')

	const query = `
		INSERT INTO playlists (${columns.join(', ')})
		VALUES (${placeholders})
		RETURNING id
	`

	const eggheadCourseResult = await eggheadPgQuery(query, values)

	const eggheadCourse = EggheadDbCourseSchema.safeParse(
		eggheadCourseResult.rows[0],
	)

	if (!eggheadCourse.success) {
		throw new Error('Failed to create course in egghead', {
			cause: eggheadCourse.error.flatten().fieldErrors,
		})
	}

	return eggheadCourse.data
}

/**
 * Updates an existing playlist in the Egghead API
 * @param input - The playlist update input
 */
export async function updateEggheadPlaylist(input: {
	eggheadPlaylistId: number
	title: string
	slug: string
	guid: string
	state: string
	visibilityState: string
	accessState: string
	body?: string
	ogImageUrl?: string
}) {
	const {
		eggheadPlaylistId,
		state,
		visibilityState,
		accessState,
		title,
		slug,
		guid,
		body = '',
		ogImageUrl = null,
	} = input
	await eggheadPgQuery(
		`UPDATE playlists SET
			state = $1,
			updated_at = NOW(),
			visibility_state = $2,
			title = $3,
			slug = $4,
			guid = $5,
			summary = $6,
			access_state = $8,
			og_image_url = $9
		WHERE id = $7`,
		[
			state,
			visibilityState,
			title,
			slug,
			guid,
			body,
			eggheadPlaylistId,
			accessState,
			ogImageUrl,
		],
	)
}

/**
 * Sets the published_at timestamp for a playlist
 * @param eggheadPlaylistId - The Egghead playlist ID
 * @param publishedAt - The published timestamp
 */
export async function setPlaylistPublishedAt(
	eggheadPlaylistId: number,
	publishedAt: string,
) {
	return eggheadPgQuery(
		`UPDATE playlists SET published_at = $1 WHERE id = $2`,
		[publishedAt, eggheadPlaylistId],
	)
}

/**
 * Clears the published_at timestamp for a playlist
 * @param eggheadPlaylistId - The Egghead playlist ID
 */
export async function clearPlaylistPublishedAt(eggheadPlaylistId: number) {
	return eggheadPgQuery(
		`UPDATE playlists SET published_at = NULL WHERE id = $1`,
		[eggheadPlaylistId],
	)
}

/**
 * Syncs an Egghead course instructor with a given instructor ID
 * @param postId - The post ID to update
 * @param userId - The user ID of the instructor
 */
export async function syncEggheadCourseInstructor(
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

	if (post.fields.postType !== 'course' || !post.fields.eggheadPlaylistId) {
		throw new Error(
			`eggheadPlaylistId is required on ${post.id} to sync egghead instructor`,
		)
	}

	return await fetch(
		`${EGGHEAD_API_V1_BASE_URL}/playlists/${post.fields.eggheadPlaylistId}`,
		{
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${eggheadToken}`,
				'User-Agent': 'authjs',
			},
			body: JSON.stringify({
				playlist: {
					instructor_id: eggheadUser.instructor.id,
				},
			}),
		},
	)
		.catch((e) => {
			throw new EggheadApiError(
				`Failed to sync egghead instructor for ${post.id}`,
			)
		})
		.then((res) => {
			return res.json()
		})
}

/**
 * Gets a playlist from the Egghead API by its ID
 * @param eggheadPlaylistId - The Egghead playlist ID
 * @returns The Egghead playlist data
 */
export async function getEggheadPlaylist(eggheadPlaylistId: number) {
	const response = await fetch(
		`https://app.egghead.io/api/v1/playlists/${eggheadPlaylistId}`,
	)

	if (!response.ok) {
		throw new Error(
			`Failed to fetch playlist: ${response.status} ${response.statusText}`,
		)
	}

	return response.json()
}
