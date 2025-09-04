'use server'

import { revalidateTag, unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import { courseBuilderAdapter, db } from '@/db'
import {
	contentResource,
	contentResourceProduct,
	contentResourceResource,
	contentResourceTag as contentResourceTagTable,
	products,
	purchases,
} from '@/db/schema'
import {
	Post,
	PostSchema,
	ProductForPostPropsSchema,
	type ProductForPostProps,
} from '@/lib/posts'
import { createNewPostVersion } from '@/lib/posts-version-query'
import { getPricingData } from '@/lib/pricing-query'
import { EggheadTag, EggheadTagSchema } from '@/lib/tags'
// Helper functions that need to be imported
import { getServerAuthSession } from '@/server/auth'
import { and, asc, count, desc, eq, like, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import { propsForCommerce } from '@coursebuilder/core/lib/pricing/props-for-commerce'
import {
	ContentResourceSchema,
	productSchema,
} from '@coursebuilder/core/schemas'
import { last } from '@coursebuilder/nodash'

import { logger } from '../utils/logger'
import type { MinimalPost } from './types'

/**
 * Search for lessons by title or body text
 */
export async function searchLessons(searchTerm: string) {
	const { session } = await getServerAuthSession()
	const userId = session?.user?.id

	const lessons = await db.query.contentResource.findMany({
		where: and(
			eq(contentResource.type, 'post'),
			sql`JSON_EXTRACT(${contentResource.fields}, '$.postType') = 'lesson'`,
			or(
				sql`LOWER(JSON_EXTRACT(${contentResource.fields}, '$.title')) LIKE ${`%${searchTerm.toLowerCase()}%`}`,
				sql`LOWER(JSON_EXTRACT(${contentResource.fields}, '$.body')) LIKE ${`%${searchTerm.toLowerCase()}%`}`,
			),
		),
		orderBy: [
			// Sort by createdById matching current user (if logged in)
			sql`CASE
				WHEN ${contentResource.createdById} = ${userId} THEN 0
				ELSE 1
			END`,
			// Secondary sort by title match (prioritize title matches)
			sql`CASE
				WHEN LOWER(JSON_EXTRACT(${contentResource.fields}, '$.title')) LIKE ${`%${searchTerm.toLowerCase()}%`} THEN 0
				ELSE 1
			END`,
			// Then sort by title alphabetically
			sql`JSON_EXTRACT(${contentResource.fields}, '$.title')`,
		],
	})

	return ContentResourceSchema.array().parse(lessons)
}

/**
 * Get a cached version of a post by slug or ID
 */
export const getCachedPost = unstable_cache(
	async (slug: string) => getPost(slug),
	['posts'],
	{ revalidate: 3600, tags: ['posts'] },
)

/**
 * Get a post by slug or ID
 */
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
		console.error(
			'Error parsing post',
			parsedPost.error,
			JSON.stringify(postData),
		)
		return null
	}

	const post = parsedPost.data

	if (!post.currentVersionId) {
		await createNewPostVersion(post)
	}

	return post
}

/**
 * Get a cached version of all posts
 */
export const getCachedAllPosts = unstable_cache(
	async () => getAllPosts(),
	['posts'],
	{ revalidate: 3600, tags: ['posts'] },
)

/**
 * Get all minimal posts data for listing/searching (lightweight for caching)
 */
export async function getAllMinimalPosts(
	search?: string,
	postType?: string,
	limit?: number,
	offset?: number,
): Promise<MinimalPost[] | null> {
	logger.info('Fetching posts with pagination', {
		limit: limit ?? null,
		offset: offset ?? null,
		search: search ?? null,
		postType: postType ?? null,
	})
	const whereConditions = [eq(contentResource.type, 'post')]

	// Add search condition
	if (search) {
		whereConditions.push(
			sql`LOWER(JSON_EXTRACT(${contentResource.fields}, '$.title')) LIKE ${`%${search.toLowerCase()}%`}`,
		)
	}

	// Add post type filter
	if (postType && postType !== 'all') {
		whereConditions.push(
			sql`JSON_EXTRACT(${contentResource.fields}, '$.postType') = ${postType}`,
		)
	}

	const posts = await db.query.contentResource.findMany({
		where: and(...whereConditions),
		columns: {
			id: true,
			createdById: true,
			createdAt: true,
			fields: true,
		},
		with: {
			tags: {
				with: {
					tag: true,
				},
				orderBy: asc(contentResourceTagTable.position),
			},
		},
		orderBy: [desc(contentResource.createdAt)],
		...(limit !== undefined && { limit }),
		...(offset !== undefined && { offset }),
	})

	// Transform to minimal format - only include fields needed for listing
	return posts.map((post) => ({
		id: post.id,
		createdById: post.createdById,
		createdAt: post.createdAt,
		fields: {
			title: post.fields?.title,
			slug: post.fields?.slug,
			state: post.fields?.state,
			postType: post.fields?.postType,
			description: post.fields?.description,
		},
		tags: post.tags.map((tagRelation) => ({
			tag: {
				id: tagRelation.tag.id,
				name: tagRelation.tag.fields?.name || '',
			},
		})),
	}))
}

/**
 * Get a cached version of all minimal posts (default view only, no search/filtering)
 */
export const getCachedAllMinimalPosts = unstable_cache(
	async () => getAllMinimalPosts(),
	['posts'],
	{ revalidate: 3600, tags: ['posts'] },
)

/**
 * Get a cached version of minimal posts with pagination and filtering
 */
export const getCachedMinimalPosts = unstable_cache(
	async (search?: string, postType?: string, limit?: number, offset?: number) =>
		getAllMinimalPosts(search, postType, limit, offset),
	['posts'],
	{ revalidate: 3600, tags: ['posts'] },
)

/**
 * Get a cached version of all minimal posts for a specific user (default view only, no search/filtering)
 */
export const getCachedAllMinimalPostsForUser = unstable_cache(
	async (userId?: string) => getAllMinimalPostsForUser(userId),
	['posts'],
	{ revalidate: 3600, tags: ['posts'] },
)

/**
 * Get all minimal posts for a specific user (lightweight for caching)
 */
export async function getAllMinimalPostsForUser(
	userId?: string,
	search?: string,
	postType?: string,
	limit?: number,
	offset?: number,
): Promise<MinimalPost[] | null> {
	logger.info('Fetching user posts with pagination', {
		userId,
		limit: limit ?? null,
		offset: offset ?? null,
		search: search ?? null,
		postType: postType ?? null,
	})
	if (!userId) {
		redirect('/')
	}

	const whereConditions = [
		eq(contentResource.type, 'post'),
		eq(contentResource.createdById, userId),
	]

	// Add search condition
	if (search) {
		whereConditions.push(
			sql`LOWER(JSON_EXTRACT(${contentResource.fields}, '$.title')) LIKE ${`%${search.toLowerCase()}%`}`,
		)
	}

	// Add post type filter
	if (postType && postType !== 'all') {
		whereConditions.push(
			sql`JSON_EXTRACT(${contentResource.fields}, '$.postType') = ${postType}`,
		)
	}

	const posts = await db.query.contentResource.findMany({
		where: and(...whereConditions),
		columns: {
			id: true,
			createdById: true,
			createdAt: true,
			fields: true,
		},
		with: {
			tags: {
				with: {
					tag: true,
				},
				orderBy: asc(contentResourceTagTable.position),
			},
		},
		orderBy: [desc(contentResource.createdAt)],
		...(limit !== undefined && { limit }),
		...(offset !== undefined && { offset }),
	})

	// Transform to minimal format - only include fields needed for listing
	return posts.map((post) => ({
		id: post.id,
		createdById: post.createdById,
		createdAt: post.createdAt,
		fields: {
			title: post.fields?.title,
			slug: post.fields?.slug,
			state: post.fields?.state,
			postType: post.fields?.postType,
			description: post.fields?.description,
		},
		tags: post.tags.map((tagRelation) => ({
			tag: {
				id: tagRelation.tag.id,
				name: tagRelation.tag.fields?.name || '',
			},
		})),
	}))
}

/**
 * Get a cached version of minimal posts for a specific user with pagination and filtering
 */
export const getCachedMinimalPostsForUser = unstable_cache(
	async (
		userId?: string,
		search?: string,
		postType?: string,
		limit?: number,
		offset?: number,
	) => getAllMinimalPostsForUser(userId, search, postType, limit, offset),
	['posts'],
	{ revalidate: 3600, tags: ['posts'] },
)

/**
 * Get all posts with optional search and filtering
 */
export async function getAllPosts(
	search?: string,
	postType?: string,
): Promise<Post[]> {
	const whereConditions = [eq(contentResource.type, 'post')]

	// Add search condition
	if (search) {
		whereConditions.push(
			sql`LOWER(JSON_EXTRACT(${contentResource.fields}, '$.title')) LIKE ${`%${search.toLowerCase()}%`}`,
		)
	}

	// Add post type filter
	if (postType && postType !== 'all') {
		whereConditions.push(
			sql`JSON_EXTRACT(${contentResource.fields}, '$.postType') = ${postType}`,
		)
	}

	const posts = await db.query.contentResource.findMany({
		where: and(...whereConditions),
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
		orderBy: desc(contentResource.createdAt),
	})

	const postsParsed = z.array(PostSchema).safeParse(posts)
	if (!postsParsed.success) {
		console.error('Error parsing posts', postsParsed.error)
		return []
	}

	return postsParsed.data
}

/**
 * Get a cached version of all posts for a specific user (default view only, no search/filtering)
 */
export const getCachedAllPostsForUser = unstable_cache(
	async (userId?: string) => getAllPostsForUser(userId),
	['posts'],
	{ revalidate: 3600, tags: ['posts'] },
)

/**
 * Get all posts for a specific user with optional search and filtering
 */
export async function getAllPostsForUser(
	userId?: string,
	search?: string,
	postType?: string,
): Promise<Post[]> {
	if (!userId) {
		redirect('/')
	}

	const whereConditions = [
		eq(contentResource.type, 'post'),
		eq(contentResource.createdById, userId),
	]

	// Add search condition
	if (search) {
		whereConditions.push(
			sql`LOWER(JSON_EXTRACT(${contentResource.fields}, '$.title')) LIKE ${`%${search.toLowerCase()}%`}`,
		)
	}

	// Add post type filter
	if (postType && postType !== 'all') {
		whereConditions.push(
			sql`JSON_EXTRACT(${contentResource.fields}, '$.postType') = ${postType}`,
		)
	}

	const posts = await db.query.contentResource.findMany({
		where: and(...whereConditions),
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
		orderBy: desc(contentResource.createdAt),
	})

	const postsParsed = z.array(PostSchema).safeParse(posts)
	if (!postsParsed.success) {
		console.error('Error parsing posts', postsParsed.error)
		return []
	}

	return postsParsed.data
}

/**
 * Get all tags for a post
 */
export async function getPostTags(postId: string): Promise<EggheadTag[]> {
	const tags = await db.query.contentResourceTag.findMany({
		where: eq(contentResourceTagTable.contentResourceId, postId),
		with: {
			tag: true,
		},
	})

	return z.array(EggheadTagSchema).parse(tags.map((tag) => tag.tag))
}

/**
 * Get all courses that include this post
 */
export async function getCoursesForPost(postId: string) {
	return await db
		.select({
			courseId: contentResource.id,
			courseTitle: sql`JSON_EXTRACT(${contentResource.fields}, '$.title')`,
			courseSlug: sql`JSON_EXTRACT(${contentResource.fields}, '$.slug')`,
			eggheadPlaylistId: sql`JSON_EXTRACT(${contentResource.fields}, '$.eggheadPlaylistId')`,
		})
		.from(contentResource)
		.innerJoin(
			contentResourceResource,
			eq(contentResource.id, contentResourceResource.resourceOfId),
		)
		.where(
			and(
				eq(contentResourceResource.resourceId, postId),
				sql`JSON_EXTRACT(${contentResource.fields}, '$.postType') = 'course'`,
			),
		)
}

/**
 * Get all post IDs
 */
export async function getAllPostIds() {
	return await db.query.contentResource
		.findMany({
			where: and(
				eq(contentResource.type, 'post'),
				sql`JSON_EXTRACT(${contentResource.fields}, '$.postType') = 'lesson'`,
			),
			columns: {
				id: true,
			},
		})
		.then((posts) => posts.map((post) => post.id))
}

/**
 * Get total count of all minimal posts (for pagination)
 */
export async function countAllMinimalPosts(
	search?: string,
	postType?: string,
): Promise<number> {
	logger.info('Counting all posts', {
		search: search ?? null,
		postType: postType ?? null,
	})

	const whereConditions = [eq(contentResource.type, 'post')]

	// Add search condition
	if (search) {
		whereConditions.push(
			sql`LOWER(JSON_EXTRACT(${contentResource.fields}, '$.title')) LIKE ${`%${search.toLowerCase()}%`}`,
		)
	}

	// Add post type filter
	if (postType && postType !== 'all') {
		whereConditions.push(
			sql`JSON_EXTRACT(${contentResource.fields}, '$.postType') = ${postType}`,
		)
	}

	const result = await db
		.select({ count: sql<number>`count(*)` })
		.from(contentResource)
		.where(and(...whereConditions))

	return result[0]?.count ?? 0
}

/**
 * Get total count of all minimal posts for a specific user (for pagination)
 */
export async function countAllMinimalPostsForUser(
	userId?: string,
	search?: string,
	postType?: string,
): Promise<number> {
	logger.info('Counting user posts', {
		userId,
		search: search ?? null,
		postType: postType ?? null,
	})

	if (!userId) {
		return 0
	}

	const whereConditions = [
		eq(contentResource.type, 'post'),
		eq(contentResource.createdById, userId),
	]

	// Add search condition
	if (search) {
		whereConditions.push(
			sql`LOWER(JSON_EXTRACT(${contentResource.fields}, '$.title')) LIKE ${`%${search.toLowerCase()}%`}`,
		)
	}

	// Add post type filter
	if (postType && postType !== 'all') {
		whereConditions.push(
			sql`JSON_EXTRACT(${contentResource.fields}, '$.postType') = ${postType}`,
		)
	}

	const result = await db
		.select({ count: sql<number>`count(*)` })
		.from(contentResource)
		.where(and(...whereConditions))

	return result[0]?.count ?? 0
}

/**
 * Get latest lessons for a specific user (for preloading in UI)
 */
export async function getLatestLessonsForUser(
	userId: string,
	limit: number = 10,
	excludeIds: string[] = [],
) {
	const whereConditions = [
		eq(contentResource.type, 'post'),
		eq(contentResource.createdById, userId),
		sql`JSON_EXTRACT(${contentResource.fields}, '$.postType') = 'lesson'`,
	]

	// Exclude specific IDs if provided
	if (excludeIds.length > 0) {
		whereConditions.push(
			sql`${contentResource.id} NOT IN (${sql.join(
				excludeIds.map((id) => sql`${id}`),
				sql`, `,
			)})`,
		)
	}

	const lessons = await db.query.contentResource.findMany({
		where: and(...whereConditions),
		orderBy: desc(contentResource.createdAt),
		limit,
	})

	const lessonsParsed = z.array(ContentResourceSchema).safeParse(lessons)
	if (!lessonsParsed.success) {
		console.error('Error parsing latest lessons', lessonsParsed.error)
		return []
	}

	return lessonsParsed.data
}

export async function getMinimalProductInfoWithoutUser(
	postId: string,
): Promise<ProductForPostProps | null> {
	const contentProduct = await db.query.contentResourceProduct.findFirst({
		where: eq(contentResourceProduct.resourceId, postId),
	})

	const product = await courseBuilderAdapter.getProduct(
		contentProduct?.productId,
	)
	if (!product) {
		return null
	}

	const productParsed = productSchema.parse(product)

	const pricingDataLoader = getPricingData({
		productId: productParsed.id,
	})

	const commerceProps = await propsForCommerce(
		{
			query: {
				allowPurchase: 'true',
			},
			userId: null,
			products: [productParsed],
		},
		courseBuilderAdapter,
	)

	const { count: purchaseCount } = await db
		.select({ count: count() })
		.from(purchases)
		.where(eq(purchases.productId, productParsed.id))
		.then((res) => res[0] ?? { count: 0 })

	const productWithQuantityAvailable = await db
		.select({ quantityAvailable: products.quantityAvailable })
		.from(products)
		.where(eq(products.id, product.id))
		.then((res) => res[0])

	let quantityAvailable = -1

	if (productWithQuantityAvailable) {
		quantityAvailable =
			productWithQuantityAvailable.quantityAvailable - purchaseCount
	}

	if (quantityAvailable < 0) {
		quantityAvailable = -1
	}

	const props = {
		availableBonuses: [],
		purchaseCount,
		quantityAvailable,
		totalQuantity: productWithQuantityAvailable?.quantityAvailable || 0,
		product,
		pricingDataLoader,
		...commerceProps,
	}

	return ProductForPostPropsSchema.parse(props)
}
