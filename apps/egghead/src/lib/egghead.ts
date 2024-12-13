import { db } from '@/db'
import { eggheadPgQuery } from '@/db/eggheadPostgres'
import { users } from '@/db/schema'
import { EggheadApiError } from '@/errors/egghead-api-error'
import { EGGHEAD_LESSON_CREATED_EVENT } from '@/inngest/events/egghead/lesson-created'
import { inngest } from '@/inngest/inngest.server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { PostAccess, PostAction, PostState, PostVisibility } from './posts'
import { getPost } from './posts-query'

import 'server-only'

export type EggheadLessonState = 'published' | 'approved' | 'retired'
export type EggheadLessonVisibilityState = 'indexed' | 'hidden'

export async function getEggheadUserProfile(userId: string) {
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

	return profile
}

const EGGHEAD_LESSON_TYPE = 'lesson'
const EGGHEAD_INITIAL_LESSON_STATE = 'approved'

export async function getEggheadLesson(eggheadLessonId: number) {
	const lesson = await fetch(
		`https://app.egghead.io/api/v1/lessons/${eggheadLessonId}`,
	).then((res) => res.json())

	return lesson
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
	published_at?: number
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
		published_at = null,
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
      published_at = $11
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
			published_at,
		],
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

	return eggheadPgQuery(
		`DELETE FROM taggings WHERE taggings.taggable_id = ${post.fields.eggheadLessonId}`,
	)
}

export async function writeLegacyTaggingsToEgghead(postId: string) {
	const post = await getPost(postId)

	if (!post) {
		throw new Error(`Post with id ${postId} not found.`)
	}

	// just wipe them and rewrite, no need to be smart
	await removeLegacyTaggingsOnEgghead(postId)

	let query = ``

	if (!post?.tags) return

	for (const tag of post.tags.map((tag) => tag.tag)) {
		const tagId = Number(tag.id.split('_')[1])
		query += `INSERT INTO taggings (tag_id, taggable_id, taggable_type, context, created_at, updated_at)
					VALUES (${tagId}, ${post.fields.eggheadLessonId}, 'Lesson', 'topics', NOW(), NOW());
		`
	}
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
	}),
})

export type EggheadLesson = z.infer<typeof eggheadLessonSchema>
