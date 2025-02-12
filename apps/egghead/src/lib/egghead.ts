import { db } from '@/db'
import { eggheadPgQuery } from '@/db/eggheadPostgres'
import { users } from '@/db/schema'
import { EggheadApiError } from '@/errors/egghead-api-error'
import { EGGHEAD_LESSON_CREATED_EVENT } from '@/inngest/events/egghead/lesson-created'
import { inngest } from '@/inngest/inngest.server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import {
	Post,
	PostAccess,
	PostAction,
	PostState,
	PostVisibility,
} from './posts'
import { getPost } from './posts-query'

import 'server-only'

import slugify from '@sindresorhus/slugify'

export type EggheadLessonState = 'published' | 'approved' | 'retired'
export type EggheadLessonVisibilityState = 'indexed' | 'hidden'

export const EGGHEAD_API_V1_BASE_URL = 'https://app.egghead.io/api/v1'

export async function getEggheadToken(userId: string) {
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
		with: {
			accounts: true,
		},
	})

	if (!user) {
		throw new Error('no-user')
	}

	const eggheadAccount = user?.accounts?.find(
		(account) => account.provider === 'egghead',
	)

	if (!eggheadAccount) {
		throw new Error('no-account')
	}

	const eggheadToken = eggheadAccount.access_token
	const eggheadExpiresAt = eggheadAccount.expires_at

	if (!eggheadToken) {
		throw new Error('no-token')
	}

	if (eggheadExpiresAt && new Date(eggheadExpiresAt * 1000) < new Date()) {
		throw new Error('token-expired')
	}

	return eggheadToken
}

export async function getEggheadUserProfile(userId: string) {
	const eggheadToken = await getEggheadToken(userId)
	const eggheadUserUrl = 'https://app.egghead.io/api/v1/users/current'

	const profile = await fetch(eggheadUserUrl, {
		headers: {
			Authorization: `Bearer ${eggheadToken}`,
			'User-Agent': 'authjs',
		},
	}).then(async (res) => {
		if (!res.ok) {
			throw new EggheadApiError(res.statusText, res.status)
		}
		return await res.json()
	})

	const parsedProfile = EggheadCurrentUserSchema.safeParse(profile)

	if (!parsedProfile.success) {
		throw new Error('Failed to parse egghead profile', {
			cause: parsedProfile.error.flatten().fieldErrors,
		})
	}

	return parsedProfile.data
}

const EGGHEAD_LESSON_TYPE = 'lesson'
const EGGHEAD_INITIAL_LESSON_STATE = 'approved'

export async function getEggheadResource(post: Post) {
	switch (post.fields.postType) {
		case 'lesson':
			if (!post.fields.eggheadLessonId) {
				throw new Error(
					`eggheadLessonId is required on ${post.id} to get egghead resource`,
				)
			}
			return getEggheadLesson(post.fields.eggheadLessonId)
		case 'course':
			if (!post.fields.eggheadPlaylistId) {
				throw new Error(
					`eggheadPlaylistId is required on ${post.id} to get egghead resource`,
				)
			}
			return getEggheadPlaylist(post.fields.eggheadPlaylistId)
		default:
			throw new Error('Unsupported post type')
	}
}

export async function getEggheadLesson(eggheadLessonId: number) {
	const lesson = await fetch(
		`https://app.egghead.io/api/v1/lessons/${eggheadLessonId}`,
	).then((res) => res.json())

	return lesson
}

export async function getEggheadPlaylist(eggheadPlaylistId: number) {
	const playlist = await fetch(
		`https://app.egghead.io/api/v1/playlists/${eggheadPlaylistId}`,
	).then((res) => res.json())

	return playlist
}

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

export async function updateEggheadLesson(input: {
	eggheadLessonId: number
	title: string
	slug: string
	guid: string
	state: string
	visibilityState: string
	access: boolean
	duration: number
	hlsUrl?: string
	body?: string
}) {
	const {
		eggheadLessonId,
		state,
		visibilityState,
		access,
		duration,
		hlsUrl = null,
		title,
		slug,
		guid,
		body = '',
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
      free_forever = NOT $10
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
		],
	)
}

export function setLessonPublishedAt(
	eggheadLessonId: number,
	publishedAt: string,
) {
	return eggheadPgQuery(`UPDATE lessons SET published_at = $1 WHERE id = $2`, [
		publishedAt,
		eggheadLessonId,
	])
}

export function clearPublishedAt(eggheadLessonId: number) {
	return eggheadPgQuery(
		`UPDATE lessons SET published_at = NULL WHERE id = $1`,
		[eggheadLessonId],
	)
}

export function determineEggheadLessonState(
	action: PostAction,
	currentState: PostState,
): EggheadLessonState {
	switch (action) {
		case 'publish':
			return 'published'
		case 'unpublish':
			return 'approved'
		case 'archive':
			return 'retired'
		default:
			return currentState === 'published'
				? 'published'
				: currentState === 'archived'
					? 'retired'
					: 'approved'
	}
}

export function determineEggheadAccess(access: PostAccess) {
	return access === 'pro' ? true : false
}

export function determineEggheadVisibilityState(
	visibility: PostVisibility,
	state: PostState,
): EggheadLessonVisibilityState {
	return visibility === 'public' && state === 'published' ? 'indexed' : 'hidden'
}

export async function removeLegacyTaggingsOnEgghead(postId: string) {
	const post = await getPost(postId)

	if (!post) {
		throw new Error(`Post with id ${postId} not found.`)
	}

	const eggheadResourceId =
		post.fields.eggheadLessonId || post.fields.eggheadPlaylistId

	return eggheadPgQuery(
		`DELETE FROM taggings WHERE taggings.taggable_id = ${eggheadResourceId}`,
	)
}

function getResourceInfo(post: Post) {
	if (post.fields.eggheadLessonId) {
		return {
			id: post.fields.eggheadLessonId,
			type: 'Lesson',
		}
	}

	if (post.fields.eggheadPlaylistId) {
		return {
			id: post.fields.eggheadPlaylistId,
			type: 'Playlist',
		}
	}

	return undefined
}

function buildTaggingQuery(post: Post) {
	const eggheadResource = getResourceInfo(post)
	if (!eggheadResource) {
		throw new Error('No egghead resource found')
	}

	let query = ``
	for (const tag of post?.tags?.map((tag) => tag.tag) || []) {
		const tagId = Number(tag.id.split('_')[1])
		query += `INSERT INTO taggings (tag_id, taggable_id, taggable_type, context, created_at, updated_at)
					VALUES (${tagId}, ${eggheadResource.id}, '${eggheadResource.type}', 'topics', NOW(), NOW());
		`
	}

	return query
}

export async function writeLegacyTaggingsToEgghead(postId: string) {
	const post = await getPost(postId)

	if (!post) {
		throw new Error(`Post with id ${postId} not found.`)
	}

	// just wipe them and rewrite, no need to be smart
	await removeLegacyTaggingsOnEgghead(postId)

	if (!post?.tags) return

	const query = buildTaggingQuery(post)
	Boolean(query) && (await eggheadPgQuery(query))
}

export const eggheadLessonSchema = z.object({
	id: z.number(),
	title: z.string(),
	slug: z.string(),
	summary: z.string().nullish(),
	topic_list: z.array(z.string()),
	free_forever: z.boolean(),
	is_pro: z.boolean(),
	body: z.string().nullish(),
	state: z.string(),
	instructor: z.object({
		id: z.number(),
		full_name: z.string().nullish(),
		url: z.string().url().nullish(),
		avatar_url: z.string().url().nullish(),
	}),
})

export type EggheadLesson = z.infer<typeof eggheadLessonSchema>

export const KvstoreSchema = z.object({
	tags: z.array(z.string()).optional(),
	difficulty: z.string().optional(),
})
export type Kvstore = z.infer<typeof KvstoreSchema>

export const EggheadDbCourseSchema = z.object({
	id: z.number(),
	access_state: z.string().optional(),
	code_url: z.string().optional(),
	created_at: z.coerce.date().optional(),
	description: z.string().optional(),
	featured: z.boolean().optional(),
	guid: z.string().optional(),
	is_complete: z.boolean().optional(),
	kvstore: KvstoreSchema.optional(),
	owner_id: z.number().optional(),
	price: z.number().optional(),
	published: z.boolean().optional(),
	published_at: z.coerce.date().optional(),
	queue_order: z.number().optional(),
	revshare_percent: z.number().optional(),
	row_order: z.number().optional(),
	shared_id: z.string().optional(),
	site: z.string().optional(),
	slug: z.string().optional(),
	square_cover_content_type: z.string().optional(),
	square_cover_file_name: z.string().optional(),
	square_cover_file_size: z.number().optional(),
	square_cover_processing: z.boolean().optional(),
	square_cover_updated_at: z.coerce.date().optional(),
	state: z.string().optional(),
	summary: z.string().optional(),
	tagline: z.string().optional(),
	title: z.string().optional(),
	tweeted_on: z.coerce.date().optional(),
	updated_at: z.coerce.date().optional(),
	visibility_state: z.string().optional(),
})
export type EggheadDbCourse = z.infer<typeof EggheadDbCourseSchema>

const EGGHEAD_INITIAL_COURSE_STATE = 'draft'

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

export function setPlaylistPublishedAt(
	eggheadPlaylistId: number,
	publishedAt: string,
) {
	return eggheadPgQuery(
		`UPDATE playlists SET published_at = $1 WHERE id = $2`,
		[publishedAt, eggheadPlaylistId],
	)
}

export const EggheadCurrentUserInstructorSchema = z.object({
	id: z.number(),
	email: z.string().email().nullish(),
	slug: z.string().nullish(),
	full_name: z.string().nullish(),
	first_name: z.string().nullish(),
	last_name: z.string().nullish(),
	twitter: z.string().nullish(),
	website: z.string().url().nullish(),
	bio_short: z.string().nullish(),
	state: z.string().nullish(),
	http_url: z.string().url().nullish(),
	path: z.string().nullish(),
	avatar_url: z.string().url().nullish(),
	avatar_480_url: z.string().url().nullish(),
	lessons_url: z.string().url().nullish(),
	lesson_tags: z.array(z.any()).nullish(),
	published_lessons: z.number().nullish(),
	published_courses: z.number().nullish(),
	rss_url: z.string().url().nullish(),
	slack_id: z.string().nullish(),
	slack_group_id: z.string().nullish(),
	pending_courses: z.number().nullish(),
	pending_lessons: z.number().nullish(),
	claimed_lessons: z.number().nullish(),
	submitted_lessons: z.number().nullish(),
	approved_lessons: z.number().nullish(),
	reviewing_lessons: z.number().nullish(),
	updated_lessons: z.number().nullish(),
	revenue_url: z.string().url().nullish(),
	affiliate_http_url: z.string().url().nullish(),
	stats_url: z.string().url().nullish(),
	playlists_url: z.string().url().nullish(),
})
export type EggheadCurrentUserInstructor = z.infer<
	typeof EggheadCurrentUserInstructorSchema
>

export const EggheadCurrentUserSchema = z.object({
	name: z.string().nullish(),
	id: z.number(),
	email: z.string().nullish(),
	full_name: z.string().nullish(),
	avatar_url: z.string().nullish(),
	contact_id: z.string().nullish(),
	roles: z.array(z.string()).nullish(),
	providers: z.array(z.string()).nullish(),
	created_at: z.number().nullish(),
	is_pro: z.boolean().nullish(),
	is_instructor: z.boolean().nullish(),
	instructor_id: z.number().nullish(),
	username: z.string().nullish(),
	timezone: z.string().nullish(),
	tags: z.array(z.any()).nullish(),
	instructor: EggheadCurrentUserInstructorSchema.nullish(),
	become_user_url: z.string().nullish(),
})
export type EggheadCurrentUser = z.infer<typeof EggheadCurrentUserSchema>
