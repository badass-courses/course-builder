import { db } from '@/db'
import { eggheadPgQuery } from '@/db/eggheadPostgres'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

import { PostAction, PostState, PostVisibility } from './posts'
import { getPost } from './posts-query'

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
			const errorText = await res.text()
			throw new Error('api-error')
		}
		return await res.json()
	})

	return profile
}

const EGGHEAD_LESSON_TYPE = 'post'
const EGGHEAD_INITIAL_LESSON_STATE = 'approved'

export async function getEggheadLesson(eggheadLessonId: number) {
	const lesson = await fetch(
		`https://app.egghead.io/api/v1/lessons/${eggheadLessonId}`,
	).then((res) => res.json())

	return lesson
}

export async function crreateEggheadLesson(input: {
	title: string
	slug: string
	instructorId: string | number
}) {
	const { title, slug, instructorId } = input
	const eggheadLessonResult = await eggheadPgQuery(
		`INSERT INTO lessons (title, instructor_id, slug, resource_type, state,
			created_at, updated_at, visibility_state)
		VALUES ($1, $2, $3, $4, $5,NOW(), NOW(), $6)
		RETURNING id`,
		[
			title,
			instructorId,
			slug,
			EGGHEAD_LESSON_TYPE,
			EGGHEAD_INITIAL_LESSON_STATE,
			'hidden',
		],
	)

	const eggheadLessonId = eggheadLessonResult.rows[0].id

	return eggheadLessonId
}

export async function updateEggheadLesson(input: {
	eggheadLessonId: number
	state: string
	visibilityState: string
	duration: number
}) {
	const { eggheadLessonId, state, visibilityState, duration } = input
	await eggheadPgQuery(
		`UPDATE lessons SET
			state = $1,
			duration = $2,
			updated_at = NOW(),
			visibility_state = $3
		WHERE id = $4`,
		[state, Math.floor(duration), visibilityState, eggheadLessonId],
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
