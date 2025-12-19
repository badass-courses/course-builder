'use server'

import { courseBuilderAdapter, db } from '@/db'
import { contentResource } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { and, desc, eq, inArray, like, notInArray, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import { ContentResource } from '@coursebuilder/core/schemas'

export async function updateResource(input: {
	id: string
	type: string
	fields: Record<string, any>
	createdById: string
}) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user || !ability.can('update', 'Content')) {
		throw new Error('Unauthorized')
	}

	const currentResource = await courseBuilderAdapter.getContentResource(
		input.id,
	)

	if (!currentResource) {
		return courseBuilderAdapter.createContentResource(input)
	}

	let resourceSlug = input.fields.slug

	if (input.fields.title !== currentResource?.fields?.title) {
		const splitSlug = currentResource?.fields?.slug.split('~') || ['', guid()]
		resourceSlug = `${slugify(input.fields.title)}~${splitSlug[1] || guid()}`
	}

	return courseBuilderAdapter.updateContentResourceFields({
		id: currentResource.id,
		fields: {
			...currentResource.fields,
			...input.fields,
			slug: resourceSlug,
			...(input.fields.image && {
				image: input.fields.image,
			}),
		},
	})
}

/**
 * Search resources from the database for adding to lists/tutorials
 * This replaces Typesense search when Typesense is not available
 */
export async function searchResources({
	query,
	types,
	excludedIds = [],
	limit = 20,
	offset = 0,
}: {
	query?: string
	types?: string[]
	excludedIds?: string[]
	limit?: number
	offset?: number
}) {
	const { ability } = await getServerAuthSession()

	// For admin/editing context, show all resources regardless of state/visibility
	const visibility: ('public' | 'private' | 'unlisted')[] = ability.can(
		'update',
		'Content',
	)
		? ['public', 'private', 'unlisted']
		: ['public', 'unlisted']

	// Default types if not specified
	const resourceTypes = types || [
		'post',
		'article',
		'tip',
		'lesson',
		'section',
		'list',
		'workshop',
		'videoResource',
	]

	// Build where conditions
	const conditions = [
		inArray(
			sql`JSON_EXTRACT (${contentResource.fields}, "$.visibility")`,
			visibility,
		),
	]

	// Filter by types - handle post subtypes (article, tip) which are stored as type:post with postType field
	const postTypes = resourceTypes.filter((t) => t === 'article' || t === 'tip')
	const otherTypes = resourceTypes.filter((t) => t !== 'article' && t !== 'tip')
	const hasPostType = resourceTypes.includes('post')

	// Build type conditions
	const typeConditions = []

	// If we want posts or post subtypes
	if (hasPostType || postTypes.length > 0) {
		if (postTypes.length > 0) {
			// Filter by specific post types (article, tip)
			typeConditions.push(
				and(
					eq(contentResource.type, 'post'),
					inArray(
						sql`JSON_EXTRACT (${contentResource.fields}, "$.postType")`,
						postTypes,
					),
				),
			)
		} else if (hasPostType) {
			// Include all posts
			typeConditions.push(eq(contentResource.type, 'post'))
		}
	}

	// Add other resource types
	if (otherTypes.length > 0) {
		typeConditions.push(inArray(contentResource.type, otherTypes))
	}

	if (typeConditions.length > 0) {
		const typeCondition =
			typeConditions.length === 1 ? typeConditions[0]! : or(...typeConditions)!
		conditions.push(typeCondition)
	}

	// Exclude specific IDs
	if (excludedIds.length > 0) {
		conditions.push(notInArray(contentResource.id, excludedIds))
	}

	// Add search query if provided
	if (query && query.trim()) {
		const searchCondition = or(
			sql`JSON_EXTRACT (${contentResource.fields}, "$.title") LIKE ${`%${query}%`}`,
			sql`JSON_EXTRACT (${contentResource.fields}, "$.description") LIKE ${`%${query}%`}`,
		)
		if (searchCondition) {
			conditions.push(searchCondition)
		}
	}

	const resources = await db.query.contentResource.findMany({
		where: and(...conditions),
		orderBy: desc(contentResource.updatedAt),
		limit,
		offset,
	})

	// Transform to match TypesenseResource format for compatibility
	return resources.map((resource) => {
		// Determine the type - if it's a post, check postType
		let displayType = resource.type
		if (resource.type === 'post' && resource.fields?.postType) {
			displayType = resource.fields.postType
		}

		return {
			id: resource.id,
			title: resource.fields?.title || '',
			type: displayType,
			slug: resource.fields?.slug || '',
			description: resource.fields?.description || resource.fields?.body || '',
			visibility: resource.fields?.visibility || 'unlisted',
			state: resource.fields?.state || 'draft',
		}
	})
}

/**
 * Get total count of resources matching the search criteria
 */
export async function getResourcesCount({
	query,
	types,
	excludedIds = [],
}: {
	query?: string
	types?: string[]
	excludedIds?: string[]
}) {
	const { ability } = await getServerAuthSession()

	const visibility: ('public' | 'private' | 'unlisted')[] = ability.can(
		'update',
		'Content',
	)
		? ['public', 'private', 'unlisted']
		: ['public', 'unlisted']

	const resourceTypes = types || [
		'post',
		'article',
		'tip',
		'lesson',
		'section',
		'list',
		'workshop',
		'videoResource',
	]

	const conditions = [
		inArray(
			sql`JSON_EXTRACT (${contentResource.fields}, "$.visibility")`,
			visibility,
		),
	]

	// Handle post subtypes
	const postTypes = resourceTypes.filter((t) => t === 'article' || t === 'tip')
	const otherTypes = resourceTypes.filter((t) => t !== 'article' && t !== 'tip')
	const hasPostType = resourceTypes.includes('post')

	const typeConditions = []

	if (hasPostType || postTypes.length > 0) {
		if (postTypes.length > 0) {
			typeConditions.push(
				and(
					eq(contentResource.type, 'post'),
					inArray(
						sql`JSON_EXTRACT (${contentResource.fields}, "$.postType")`,
						postTypes,
					),
				),
			)
		} else if (hasPostType) {
			typeConditions.push(eq(contentResource.type, 'post'))
		}
	}

	if (otherTypes.length > 0) {
		typeConditions.push(inArray(contentResource.type, otherTypes))
	}

	if (typeConditions.length > 0) {
		const typeCondition =
			typeConditions.length === 1 ? typeConditions[0]! : or(...typeConditions)!
		conditions.push(typeCondition)
	}

	if (excludedIds.length > 0) {
		conditions.push(notInArray(contentResource.id, excludedIds))
	}

	if (query && query.trim()) {
		const searchCondition = or(
			sql`JSON_EXTRACT (${contentResource.fields}, "$.title") LIKE ${`%${query}%`}`,
			sql`JSON_EXTRACT (${contentResource.fields}, "$.description") LIKE ${`%${query}%`}`,
		)
		if (searchCondition) {
			conditions.push(searchCondition)
		}
	}

	const result = await db
		.select({ count: sql<number>`count(*)` })
		.from(contentResource)
		.where(and(...conditions))

	return Number(result[0]?.count || 0)
}
