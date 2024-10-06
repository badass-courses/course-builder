'use server'

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import { courseBuilderAdapter, db } from '@/db'
import { eggheadPgQuery } from '@/db/eggheadPostgres'
import {
	contentContributions,
	contentResource,
	contentResourceResource,
	contentResourceTag as contentResourceTagTable,
	contentResourceVersion as contentResourceVersionTable,
	contributionTypes,
	users,
} from '@/db/schema'
import { NewPost, Post, PostSchema, PostUpdate } from '@/lib/posts'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import { subject } from '@casl/ability'
import slugify from '@sindresorhus/slugify'
import { and, asc, desc, eq, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import 'server-only'

import { v4 } from 'uuid'

import { EggheadTag, EggheadTagSchema } from './tags'

export async function deletePost(id: string) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	const post = PostSchema.nullish().parse(
		await db.query.contentResource.findFirst({
			where: eq(contentResource.id, id),
			with: {
				resources: true,
			},
		}),
	)

	if (!post) {
		throw new Error(`Post with id ${id} not found.`)
	}

	if (!user || !ability.can('delete', subject('Content', post))) {
		throw new Error('Unauthorized')
	}

	if (post.fields.eggheadLessonId) {
		await eggheadPgQuery(
			`UPDATE lessons SET state = 'retired' WHERE id = ${post.fields.eggheadLessonId}`,
		)
	}

	await db
		.delete(contentResourceResource)
		.where(eq(contentResourceResource.resourceOfId, id))

	await db.delete(contentResource).where(eq(contentResource.id, id))

	revalidateTag('posts')
	revalidateTag(id)
	revalidatePath('/posts')

	return true
}

export const getCachedPost = unstable_cache(
	async (slug: string) => getPost(slug),
	['posts'],
	{ revalidate: 3600 },
)

async function createNewPostVersion(post: Post | null, createdById?: string) {
	if (!post) return null
	const currentVersion = post?.currentVersionId
		? await db.query.contentResourceVersion.findFirst({
				where: eq(contentResourceVersionTable.id, post.currentVersionId),
			})
		: null
	const versionId = `version~${guid()}`
	await db.transaction(async (trx) => {
		await trx.insert(contentResourceVersionTable).values({
			id: versionId,
			resourceId: post.id,
			parentVersionId: currentVersion ? currentVersion.id : null,
			versionNumber: currentVersion ? currentVersion.versionNumber + 1 : 1,
			fields: {
				...post.fields,
			},
			createdAt: new Date(),
			createdById: createdById ? createdById : post.createdById,
		})

		post.currentVersionId = versionId

		await trx
			.update(contentResource)
			.set({ currentVersionId: versionId })
			.where(eq(contentResource.id, post.id))
	})
	return post
}

export async function getPost(slug: string): Promise<Post | null> {
	const postData = await db.query.contentResource.findFirst({
		where: or(
			eq(sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`, slug),
			eq(contentResource.id, slug),
		),
		with: {
			tags: {
				with: {
					tag: true,
				},
				orderBy: asc(contentResourceTagTable.position),
			},
			resources: {
				with: {
					resource: true,
				},
				orderBy: asc(contentResourceResource.position),
			},
		},
	})

	const parsedPost = PostSchema.safeParse(postData)
	if (!parsedPost.success) {
		console.error('Error parsing post', parsedPost.error)
		return null
	}

	const post = parsedPost.data

	if (!post.currentVersionId) {
		await createNewPostVersion(post)
	}

	return post
}

export const getCachedAllPosts = unstable_cache(
	async () => getAllPosts(),
	['posts'],
	{ revalidate: 3600 },
)

export async function getAllPosts(): Promise<Post[]> {
	const posts = await db.query.contentResource.findMany({
		where: eq(contentResource.type, 'post'),
		with: {
			tags: {
				with: {
					tag: true,
				},
				orderBy: asc(contentResourceTagTable.position),
			},
		},
		orderBy: desc(contentResource.createdAt),
	})

	const postsParsed = z.array(PostSchema).safeParse(posts)
	if (!postsParsed.success) {
		console.error('Error parsing posts', postsParsed.error)
		return []
	}

	return postsParsed.data
}

export const getCachedAllPostsForUser = unstable_cache(
	async (userId?: string) => getAllPostsForUser(userId),
	['posts'],
	{ revalidate: 3600 },
)

export async function getAllPostsForUser(userId?: string): Promise<Post[]> {
	if (!userId) {
		redirect('/')
	}

	const posts = await db.query.contentResource.findMany({
		where: and(
			eq(contentResource.type, 'post'),
			eq(contentResource.createdById, userId),
		),
		with: {
			tags: {
				with: {
					tag: true,
				},
				orderBy: asc(contentResourceTagTable.position),
			},
		},
		orderBy: desc(contentResource.createdAt),
	})

	const postsParsed = z.array(PostSchema).safeParse(posts)
	if (!postsParsed.success) {
		console.error('Error parsing posts', postsParsed.error)
		return []
	}

	return postsParsed.data
}

export async function createPost(input: NewPost) {
	const { session, ability } = await getServerAuthSession()

	if (!session?.user?.id || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const user = await db.query.users.findFirst({
		where: eq(users.id, session?.user?.id),
		with: {
			accounts: true,
		},
	})

	if (!user) {
		throw new Error('🚨 User not found')
	}

	const eggheadToken = user?.accounts?.find(
		(account) => account.provider === 'egghead',
	)?.access_token

	const eggheadUserUrl = 'https://app.egghead.io/api/v1/users/current'

	const profile = await fetch(eggheadUserUrl, {
		headers: {
			Authorization: `Bearer ${eggheadToken}`,
			'User-Agent': 'authjs',
		},
	}).then(async (res) => await res.json())

	const postGuid = guid()
	const newPostId = `post_${postGuid}`

	const EGGHEAD_LESSON_TYPE = 'post'
	const EGGHEAD_INITIAL_LESSON_STATE = 'approved'

	const eggheadLessonResult = await eggheadPgQuery(
		`INSERT INTO lessons (title, instructor_id, slug, resource_type, state ,created_at, updated_at, visibility_state)
		VALUES ($1, $2, $3, $4, $5,NOW(), NOW())
		RETURNING id`,
		[
			input.title,
			profile.instructor.id,
			`${slugify(input.title)}~${postGuid}`,
			EGGHEAD_LESSON_TYPE,
			EGGHEAD_INITIAL_LESSON_STATE,
			'hidden',
		],
	)

	const eggheadLessonId = eggheadLessonResult.rows[0].id

	await db
		.insert(contentResource)
		.values({
			id: newPostId,
			type: 'post',
			createdById: user.id,
			fields: {
				title: input.title,
				state: 'draft',
				visibility: 'unlisted',
				slug: `${slugify(input.title)}~${postGuid}`,
				eggheadLessonId,
			},
		})
		.catch((error) => {
			console.error('🚨 Error creating post', error)
			throw error
		})

	const post = await getPost(newPostId)

	await createNewPostVersion(post)

	if (post && input?.videoResourceId) {
		await db
			.insert(contentResourceResource)
			.values({ resourceOfId: post.id, resourceId: input.videoResourceId })
	}

	if (post) {
		const contributionType = await db.query.contributionTypes.findFirst({
			where: eq(contributionTypes.slug, 'author'),
		})

		if (contributionType) {
			await db.insert(contentContributions).values({
				id: `cc-${guid()}`,
				userId: user.id,
				contentId: post.id,
				contributionTypeId: contributionType.id,
			})
		}

		revalidateTag('posts')

		return post
	} else {
		throw new Error('🚨 Error creating post: Post not found')
	}
}

export async function updatePost(
	input: PostUpdate,
	action: 'save' | 'publish' | 'archive' | 'unpublish' = 'save',
) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	const currentPost = await getPost(input.id)

	if (!currentPost) {
		throw new Error(`Post with id ${input.id} not found.`)
	}

	if (!user || !ability.can(action, subject('Content', currentPost))) {
		throw new Error('Unauthorized')
	}

	let postSlug = currentPost.fields.slug

	if (input.fields.title !== currentPost.fields.title) {
		const splitSlug = currentPost?.fields.slug.split('~') || ['', guid()]
		postSlug = `${slugify(input.fields.title)}~${splitSlug[1] || guid()}`
	}

	let lessonState = 'approved'
	let lessonVisibilityState = 'hidden'

	switch (action) {
		case 'publish':
			lessonState = 'published'
			break
		case 'unpublish':
			lessonState = 'approved'
			break
	}

	switch (input.fields.visibility) {
		case 'public':
			lessonVisibilityState = 'indexed'
			break
		default:
			lessonVisibilityState = 'hidden'
			break
	}

	if (currentPost.fields.eggheadLessonId) {
		await eggheadPgQuery(
			`UPDATE lessons SET state = '${lessonState}', 
				updated_at = NOW(), 
				visibility_state = '${lessonVisibilityState}' 
			WHERE id = ${currentPost.fields.eggheadLessonId}`,
		)
	}

	await courseBuilderAdapter.updateContentResourceFields({
		id: currentPost.id,
		fields: {
			...currentPost.fields,
			...input.fields,
			slug: postSlug,
		},
	})

	revalidateTag('posts')

	const post = await getPost(currentPost.id)

	await createNewPostVersion(post, user.id)

	return post
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

	for (const tag of post.tags.map((tag) => tag.tag)) {
		const tagId = Number(tag.id.split('_')[1])
		query += `INSERT INTO taggings (tag_id, taggable_id, taggable_type, context, created_at, updated_at)
					VALUES (${tagId}, ${post.fields.eggheadLessonId}, 'Lesson', 'topics', NOW(), NOW());
		`
	}
	Boolean(query) && (await eggheadPgQuery(query))
}

export async function getPostTags(postId: string): Promise<EggheadTag[]> {
	const tags = await db.query.contentResourceTag.findMany({
		where: eq(contentResourceTagTable.contentResourceId, postId),
		with: {
			tag: true,
		},
	})

	return z.array(EggheadTagSchema).parse(tags.map((tag) => tag.tag))
}

export async function addTagToPost(postId: string, tagId: string) {
	await db.insert(contentResourceTagTable).values({
		contentResourceId: postId,
		tagId,
	})
	await writeLegacyTaggingsToEgghead(postId)
}

export async function removeTagFromPost(postId: string, tagId: string) {
	await db
		.delete(contentResourceTagTable)
		.where(
			and(
				eq(contentResourceTagTable.contentResourceId, postId),
				eq(contentResourceTagTable.tagId, tagId),
			),
		)
	await writeLegacyTaggingsToEgghead(postId)
}
