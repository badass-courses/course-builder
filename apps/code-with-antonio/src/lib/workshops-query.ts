'use server'

import { cache } from 'react'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import {
	contentResource,
	contentResourceProduct,
	contentResourceResource,
	contentResourceTag as contentResourceTagTable,
	products as productTable,
} from '@/db/schema'
import {
	getContentNavigationCacheKey,
	normalizeContentNavigationOptions,
	type ContentNavigationOptions,
} from '@/lib/content-navigation-options'
import { getContentNavigation } from '@/lib/content-navigation-query'
import {
	MinimalWorkshopSchema,
	WorkshopSchema,
	type CreateWorkshopWithLessonsInput,
	type Workshop,
} from '@/lib/workshops'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { and, asc, desc, eq, inArray, like, or, sql } from 'drizzle-orm'
import z from 'zod'

import {
	ContentResource,
	ContentResourceSchema,
	productSchema,
} from '@coursebuilder/core/schemas'
import { last } from '@coursebuilder/nodash'

import { upsertPostToTypeSense } from './typesense-query'

const getCachedWorkshopNavigationInternal = cache(
	async (
		slug: string,
		depth: ContentNavigationOptions['depth'],
		caller: ContentNavigationOptions['caller'] | null,
		debug: ContentNavigationOptions['debug'],
	) => {
		const normalizedOptions = normalizeContentNavigationOptions({
			depth,
			caller: caller ?? undefined,
			debug,
		})
		const cacheKey = getContentNavigationCacheKey(slug, normalizedOptions)

		return unstable_cache(
			async () => getWorkshopNavigation(slug, normalizedOptions),
			['workshop-navigation', cacheKey],
			{ revalidate: 3600, tags: ['workshop-navigation', slug] },
		)()
	},
)

/**
 * Get cached workshop navigation
 * Combines React cache() for request-level deduplication with unstable_cache() for persistent caching
 */
export async function getCachedWorkshopNavigation(
	slug: string,
	options?: ContentNavigationOptions,
) {
	const normalizedOptions = normalizeContentNavigationOptions(options)
	return getCachedWorkshopNavigationInternal(
		slug,
		normalizedOptions.depth,
		normalizedOptions.caller,
		normalizedOptions.debug,
	)
}

/**
 * Fetches workshop navigation data
 * Uses the generic content navigation query
 */
export async function getWorkshopNavigation(
	moduleSlugOrId: string,
	options?: ContentNavigationOptions,
) {
	return getContentNavigation(moduleSlugOrId, options)
}

/**
 * Get cached workshop product
 * Combines React cache() for request-level deduplication with unstable_cache() for persistent caching
 */
export const getCachedWorkshopProduct = cache(
	async (workshopIdOrSlug: string) => {
		return unstable_cache(
			async () => getWorkshopProduct(workshopIdOrSlug),
			['workshop-product', workshopIdOrSlug],
			{ revalidate: 3600, tags: ['workshop-product', workshopIdOrSlug] },
		)()
	},
)

export async function getWorkshopProduct(workshopIdOrSlug: string) {
	// This query finds a product associated with a workshop in two ways:
	// 1. Direct association: Workshop -> Product
	// 2. Indirect via cohort: Workshop -> Cohort -> Product
	//
	// It prioritizes direct associations (priority=1) over cohort associations (priority=2)
	// and returns only the first matching product

	const query = sql`
WITH ProductCandidates AS (
    -- Directly associated product
    SELECT
        p.*,
        1 as priority
    FROM ${contentResource} cr
    LEFT JOIN ${contentResourceProduct} crp ON cr.id = crp.resourceId
    LEFT JOIN ${productTable} p ON crp.productId = p.id
    WHERE
        (cr.id = ${workshopIdOrSlug} OR JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.slug')) = ${workshopIdOrSlug})
        AND cr.type = 'workshop'
        AND p.id IS NOT NULL

    UNION ALL

    -- Product associated via a cohort
    SELECT
        p_cohort.*,
        2 as priority
    FROM ${contentResource} cr_workshop -- The workshop itself
    -- Link workshop to its parent resource (which we'll check is a cohort)
    JOIN ${contentResourceResource} crr_workshop_to_parent ON cr_workshop.id = crr_workshop_to_parent.resourceId
    -- The parent resource, ensuring it's a cohort
    JOIN ${contentResource} cr_cohort ON crr_workshop_to_parent.resourceOfId = cr_cohort.id AND cr_cohort.type = 'cohort'
    -- Link cohort to product
    LEFT JOIN ${contentResourceProduct} crp_cohort ON cr_cohort.id = crp_cohort.resourceId
    LEFT JOIN ${productTable} p_cohort ON crp_cohort.productId = p_cohort.id
    WHERE
        (cr_workshop.id = ${workshopIdOrSlug} OR JSON_UNQUOTE(JSON_EXTRACT(cr_workshop.fields, '$.slug')) = ${workshopIdOrSlug})
        AND cr_workshop.type = 'workshop' -- Ensure the initial resource is a workshop
        AND p_cohort.id IS NOT NULL
)
SELECT *
FROM ProductCandidates
ORDER BY priority ASC
LIMIT 1;`
	const results = await db.execute(query)

	const parsedProduct = productSchema.safeParse(results.rows[0])

	if (!parsedProduct.success) {
		console.debug('Error parsing product', parsedProduct.error)
		return null
	}

	return parsedProduct.data
}

/**
 * Get cached minimal workshop data
 * Combines React cache() for request-level deduplication with unstable_cache() for persistent caching
 */
export const getCachedMinimalWorkshop = cache(async (slug: string) => {
	return unstable_cache(
		async () => getMinimalWorkshop(slug),
		['workshop-minimal', slug],
		{ revalidate: 3600, tags: ['workshop-minimal', slug] },
	)()
})

export async function getMinimalWorkshop(moduleSlugOrId: string) {
	const workshop = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(
					sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
					moduleSlugOrId,
				),
				eq(contentResource.id, moduleSlugOrId),
			),
			eq(contentResource.type, 'workshop'),
		),
		columns: {
			id: true,
			type: true,
			fields: true,
		},
	})

	if (!workshop) {
		await log.error('getMinimalWorkshop.notFound', {
			moduleSlugOrId,
		})
		return null
	}

	return MinimalWorkshopSchema.parse(workshop)
}

export async function getWorkshop(moduleSlugOrId: string) {
	const { ability } = await getServerAuthSession()

	const visibility: ('public' | 'private' | 'unlisted')[] = ability.can(
		'update',
		'Content',
	)
		? ['public', 'private', 'unlisted']
		: ['public', 'unlisted']

	const workshop = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(
					sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
					moduleSlugOrId,
				),
				eq(contentResource.id, moduleSlugOrId),
			),
			eq(contentResource.type, 'workshop'),
			inArray(
				sql`JSON_EXTRACT (${contentResource.fields}, "$.visibility")`,
				visibility,
			),
		),
		with: {
			tags: {
				with: {
					tag: true,
				},
				orderBy: asc(contentResourceTagTable.position),
			},
			resources: {
				// sections and stand-alone top level resource join
				with: {
					resource: {
						// section or resource
						with: {
							resources: {
								// lessons in section join
								with: {
									resource: true, //lesson, no need for more (videos etc)
								},
								orderBy: asc(contentResourceResource.position),
							},
						},
					},
				},
				orderBy: asc(contentResourceResource.position),
			},
			resourceProducts: {
				with: {
					product: {
						with: {
							price: true,
						},
					},
				},
			},
		},
	})

	const parsedWorkshop = WorkshopSchema.safeParse(workshop)
	if (!parsedWorkshop.success) {
		console.error('Error parsing workshop', workshop, parsedWorkshop.error)
		return null
	}

	const workshopData = parsedWorkshop.data

	return workshopData
}

export async function getAllWorkshops() {
	const { ability } = await getServerAuthSession()

	const visibility: ('public' | 'private' | 'unlisted')[] = ability.can(
		'update',
		'Content',
	)
		? ['public', 'private', 'unlisted']
		: ['public']

	const workshops: ContentResource[] = await db.query.contentResource.findMany({
		where: and(
			eq(contentResource.type, 'workshop'),
			inArray(
				sql`JSON_EXTRACT (${contentResource.fields}, "$.visibility")`,
				visibility,
			),
		),
		with: {
			tags: {
				with: {
					tag: true,
				},
				orderBy: asc(contentResourceTagTable.position),
			},
			// Only fetch one level of resources for homepage listing
			// Deep nesting can cause stack overflow during RSC serialization
			resources: {
				orderBy: asc(contentResourceResource.position),
				with: {
					resource: true,
				},
			},
		},
		orderBy: desc(contentResource.createdAt),
	})

	const parsedWorkshops = z.array(WorkshopSchema).safeParse(workshops)
	if (!parsedWorkshops.success) {
		console.error('Error parsing workshop', workshops, parsedWorkshops.error)
		throw new Error('Error parsing workshop')
	}

	return parsedWorkshops.data
}

export const addResourceToWorkshop = async ({
	resource,
	workshopId,
}: {
	resource: ContentResource
	workshopId: string
}) => {
	const workshop = await db.query.contentResource.findFirst({
		where: like(contentResource.id, `%${last(workshopId.split('-'))}%`),
		with: {
			resources: true,
		},
	})

	if (!workshop) {
		throw new Error(`Workshop with id ${workshopId} not found`)
	}
	await db.insert(contentResourceResource).values({
		resourceOfId: workshop.id,
		resourceId: resource.id,
		position: workshop.resources.length,
	})

	const resourceResource = db.query.contentResourceResource.findFirst({
		where: and(
			eq(contentResourceResource.resourceOfId, workshop.id),
			eq(contentResourceResource.resourceId, resource.id),
		),
		with: {
			resource: true,
		},
	})

	// Invalidate workshop caches
	revalidateTag('workshop', 'max')
	revalidateTag('workshop-navigation', 'max')
	const workshopSlug = workshop.fields?.slug
	if (workshopSlug) {
		revalidateTag(workshopSlug, 'max')
	}

	return resourceResource
}

export const updateResourcePosition = async ({
	currentParentResourceId,
	parentResourceId,
	resourceId,
	position,
}: {
	currentParentResourceId: string
	parentResourceId: string
	resourceId: string
	position: number
}) => {
	const result = await db
		.update(contentResourceResource)
		.set({ position, resourceOfId: parentResourceId })
		.where(
			and(
				eq(contentResourceResource.resourceOfId, currentParentResourceId),
				eq(contentResourceResource.resourceId, resourceId),
			),
		)

	// Invalidate generic workshop cache (per-workshop invalidation handled by caller)
	revalidateTag('workshop', 'max')

	return result
}

export async function updateWorkshop(input: Partial<Workshop>) {
	if (!input.id) {
		throw new Error('ID is required')
	}
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('update', 'Content')) {
		throw new Error('Unauthorized')
	}

	const currentWorkshop = await getWorkshop(input.id)

	if (!currentWorkshop) {
		throw new Error(`Workshop with id ${input.id} not found.`)
	}

	let workshopSlug = currentWorkshop.fields.slug

	if (
		input.fields?.title !== currentWorkshop.fields.title &&
		input.fields?.slug?.includes('~')
	) {
		const splitSlug = currentWorkshop?.fields.slug.split('~') || ['', guid()]
		workshopSlug = `${slugify(input.fields.title)}~${splitSlug[1] || guid()}`
		await log.info('post.update.slug.changed', {
			postId: input.id,
			oldSlug: currentWorkshop.fields.slug,
			newSlug: workshopSlug,
			userId: user.id,
		})
	} else if (input.fields?.slug !== currentWorkshop.fields.slug) {
		if (!input.fields?.slug) {
			throw new Error('Slug is required')
		}
		workshopSlug = input.fields?.slug
		await log.info('post.update.slug.manual', {
			postId: input.id,
			oldSlug: currentWorkshop.fields.slug,
			newSlug: workshopSlug,
			userId: user.id,
		})
	}

	try {
		await upsertPostToTypeSense(
			{
				id: currentWorkshop.id,
				organizationId: currentWorkshop.organizationId,
				type: currentWorkshop.type,
				createdAt: currentWorkshop.createdAt,
				updatedAt: new Date(),
				deletedAt: currentWorkshop.deletedAt,
				createdById: currentWorkshop.createdById,
				resources: currentWorkshop.resources as any,
				createdByOrganizationMembershipId:
					currentWorkshop.createdByOrganizationMembershipId,
				fields: {
					...currentWorkshop.fields,
					...input.fields,
					description: input.fields.description || '',
					slug: workshopSlug,
				},
			},
			'save',
		)
		await log.info('post.update.typesense.success', {
			workshopId: currentWorkshop.id,
			action: 'save',
			userId: user.id,
		})
		console.log('🔍 Post updated in Typesense')
	} catch (error) {
		await log.error('post.update.typesense.failed', {
			workshopId: currentWorkshop.id,
			action: 'save',
			userId: user.id,
		})
		console.log('❌ Error updating post in Typesense', error)
	}

	const updatedWorkshop =
		await courseBuilderAdapter.updateContentResourceFields({
			id: currentWorkshop.id,
			fields: {
				...currentWorkshop.fields,
				...input.fields,
				updatedAt: new Date(),
				slug: workshopSlug,
			},
		})

	// Invalidate generic workshop caches
	revalidateTag('workshop', 'max')
	revalidateTag('workshops', 'max')

	// Invalidate per-workshop caches using slug (matches cache tags)
	revalidateTag(currentWorkshop.fields.slug, 'max')
	revalidateTag('workshop-navigation', 'max')
	revalidateTag('workshop-product', 'max')
	revalidateTag('workshop-minimal', 'max')

	// If slug changed, invalidate new slug too
	if (workshopSlug !== currentWorkshop.fields.slug) {
		revalidateTag(workshopSlug, 'max')
	}

	// Invalidate paths
	revalidatePath('/workshops')
	revalidatePath(`/workshops/${workshopSlug}`)

	return {
		...updatedWorkshop,
		resources: {},
	}
}

export async function getWorkshopsForLesson(lessonId: string) {
	// Query to find all workshops containing the lesson either directly or through a section
	const query = sql`
		WITH workshop_lesson AS (
			-- Direct lesson in workshop
			SELECT DISTINCT
				w.id,
				w.type,
				w.fields,
				w.createdAt,
				w.updatedAt,
				w.deletedAt,
				w.createdById,
				w.currentVersionId,
				w.organizationId,
				w.createdByOrganizationMembershipId,
				NULL as resources
			FROM ${contentResource} w
			JOIN ${contentResourceResource} crr ON w.id = crr.resourceOfId
			WHERE w.type = 'workshop'
				AND crr.resourceId = ${lessonId}

			UNION

			-- Lesson in section in workshop
			SELECT DISTINCT
				w.id,
				w.type,
				w.fields,
				w.createdAt,
				w.updatedAt,
				w.deletedAt,
				w.createdById,
				w.currentVersionId,
				w.organizationId,
				w.createdByOrganizationMembershipId,
				NULL as resources
			FROM ${contentResource} w
			JOIN ${contentResourceResource} crr_section ON w.id = crr_section.resourceOfId
			JOIN ${contentResource} section ON section.id = crr_section.resourceId
			JOIN ${contentResourceResource} crr_lesson ON section.id = crr_lesson.resourceOfId
			WHERE w.type = 'workshop'
				AND section.type = 'section'
				AND crr_lesson.resourceId = ${lessonId}
		)
		SELECT
			id,
			type,
			fields,
			createdAt,
			updatedAt,
			deletedAt,
			createdById,
			currentVersionId,
			organizationId,
			createdByOrganizationMembershipId,
			resources
		FROM workshop_lesson
		ORDER BY createdAt ASC;
	`

	const result = await db.execute(query)
	if (!result.rows.length) {
		return []
	}

	const parsedWorkshops = z.array(ContentResourceSchema).safeParse(result.rows)
	if (!parsedWorkshops.success) {
		await log.error('getWorkshopsForLesson.parseError', {
			lessonId,
			issues: parsedWorkshops.error.issues,
		})
		return []
	}

	return parsedWorkshops.data
}

/**
 * Creates a workshop with lessons and sections in bulk
 * Supports product/pricing/coupon creation
 */
export async function createWorkshopWithLessons(
	input: CreateWorkshopWithLessonsInput,
) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	try {
		// Create workshop via adapter
		const result = await courseBuilderAdapter.createWorkshop(input, user.id)

		// Index in TypeSense
		try {
			await upsertPostToTypeSense(result.workshop, 'save')
			for (const lesson of result.lessons) {
				await upsertPostToTypeSense(lesson, 'save')
			}
		} catch (error) {
			await log.error('workshop.typesense.failed', {
				workshopId: result.workshop.id,
				error: error instanceof Error ? error.message : String(error),
			})
		}

		// Logging
		await log.info('workshop.created', {
			workshopId: result.workshop.id,
			userId: user.id,
			sectionCount: result.sections.length,
			lessonCount: result.lessons.length,
			hasProduct: !!result.product,
		})

		revalidateTag('workshops', 'max')
		revalidatePath('/workshops')

		return result
	} catch (error) {
		await log.error('workshop.creation.failed', {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			userId: user.id,
			title: input.workshop.title,
		})
		throw error
	}
}
