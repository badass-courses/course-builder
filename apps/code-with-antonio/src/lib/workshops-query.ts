'use server'

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import {
	contentResource,
	contentResourceProduct,
	contentResourceResource,
	products as productTable,
} from '@/db/schema'
import {
	CohortResource,
	MinimalWorkshopSchema,
	NavigationLessonSchema,
	NavigationPostSchema,
	NavigationSectionSchema,
	QueryResultRowSchema,
	ResourceRawSchema,
	SectionRawSchema,
	SolutionRawSchema,
	WorkshopNavigation,
	WorkshopNavigationSchema,
	WorkshopRawSchema,
	WorkshopSchema,
	type CohortInfo,
	type ResourceRaw,
	type SectionRaw,
	type SolutionRaw,
	type Workshop,
	type WorkshopRaw,
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

/**
 * Fetches workshop navigation data with a single efficient query
 */
async function getAllWorkshopLessonsWithSectionInfo(
	moduleSlugOrId: string,
	moduleType: 'tutorial' | 'workshop',
): Promise<WorkshopNavigation | null> {
	// Build a single optimized query using CTEs (Common Table Expressions)
	const query = sql`
		WITH workshop AS (
			-- Get the workshop metadata
			SELECT
				cr.id,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.slug')) as slug,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.title')) as title,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.coverImage.url')) as coverImage
			FROM ${contentResource} as cr
			WHERE cr.type = ${moduleType}
				AND JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.slug')) = ${moduleSlugOrId}
			LIMIT 1
		),
		cohorts AS (
			-- Get cohorts that contain this workshop
			SELECT DISTINCT
				cr.id as cohortId,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.slug')) as cohortSlug,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.title')) as cohortTitle,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.startsAt')) as startsAt,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.endsAt')) as endsAt,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.timezone')) as timezone,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.cohortTier')) as cohortTier,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.maxSeats')) as maxSeats
			FROM ${contentResource} as cr
			JOIN ${contentResourceResource} as crr ON cr.id = crr.resourceOfId
			WHERE cr.type = 'cohort'
				AND crr.resourceId IN (SELECT id FROM workshop)
		),
		cohort_resources AS (
			-- Get resources for each cohort
			SELECT
				cr.id as resourceId,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.slug')) as resourceSlug,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.title')) as resourceTitle,
				cr.type as resourceType,
				crr.position as resourcePosition,
				crr.resourceOfId as cohortId,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.startsAt')) as startsAt
			FROM ${contentResource} as cr
			JOIN ${contentResourceResource} as crr ON cr.id = crr.resourceId
			JOIN cohorts ON cohorts.cohortId = crr.resourceOfId
			WHERE cr.type IN ('workshop', 'tutorial')
		),
		sections AS (
			-- Get all sections with their positions
			SELECT
				cr.id,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.slug')) as slug,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.title')) as title,
				crr.position
			FROM ${contentResource} as cr
			JOIN ${contentResourceResource} as crr ON cr.id = crr.resourceId
			JOIN workshop ON workshop.id = crr.resourceOfId
			WHERE cr.type = 'section'
		),
		resources AS (
			-- Get top-level resources (not in sections)
			SELECT
				cr.id,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.slug')) as slug,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.title')) as title,
				crr.position,
				cr.type,
				NULL as sectionId
			FROM ${contentResource} as cr
			JOIN ${contentResourceResource} as crr ON cr.id = crr.resourceId
			JOIN workshop ON workshop.id = crr.resourceOfId
			WHERE (cr.type = 'lesson' OR cr.type = 'post')

			UNION ALL

			-- Get resources within sections
			SELECT
				cr.id,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.slug')) as slug,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.title')) as title,
				crr.position,
				cr.type,
				crr.resourceOfId as sectionId
			FROM ${contentResource} as cr
			JOIN ${contentResourceResource} as crr ON cr.id = crr.resourceId
			JOIN sections ON sections.id = crr.resourceOfId
			WHERE (cr.type = 'lesson' OR cr.type = 'post')
		),
		solutions AS (
			-- Get solutions for lessons
			SELECT
				cr.id,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.slug')) as slug,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.title')) as title,
				crr.resourceOfId as resourceId
			FROM ${contentResource} as cr
			JOIN ${contentResourceResource} as crr ON cr.id = crr.resourceId
			JOIN resources ON resources.id = crr.resourceOfId AND resources.type = 'lesson'
			WHERE cr.type = 'solution'
		)
		-- Get all data in separate result sets without complex ordering
		SELECT 'workshop' as type, id, slug, title, coverImage, NULL as position, NULL as sectionId, NULL as resourceId,
			NULL as cohortId, NULL as cohortSlug, NULL as cohortTitle, NULL as startsAt, NULL as endsAt, NULL as timezone, NULL as cohortTier, NULL as maxSeats,
			NULL as resourceType, NULL as resourcePosition
		FROM workshop
		UNION ALL
		SELECT 'section' as type, id, slug, title, NULL as coverImage, position, NULL as sectionId, NULL as resourceId,
			NULL as cohortId, NULL as cohortSlug, NULL as cohortTitle, NULL as startsAt, NULL as endsAt, NULL as timezone, NULL as cohortTier, NULL as maxSeats,
			NULL as resourceType, NULL as resourcePosition
		FROM sections
		UNION ALL
		SELECT 'resource' as type, id, slug, title, NULL as coverImage, position, sectionId, NULL as resourceId,
			NULL as cohortId, NULL as cohortSlug, NULL as cohortTitle, NULL as startsAt, NULL as endsAt, NULL as timezone, NULL as cohortTier, NULL as maxSeats,
			type as resourceType, NULL as resourcePosition
		FROM resources
		UNION ALL
		SELECT 'solution' as type, id, slug, title, NULL as coverImage, NULL as position, NULL as sectionId, resourceId,
			NULL as cohortId, NULL as cohortSlug, NULL as cohortTitle, NULL as startsAt, NULL as endsAt, NULL as timezone, NULL as cohortTier, NULL as maxSeats,
			NULL as resourceType, NULL as resourcePosition
		FROM solutions
		UNION ALL
		SELECT 'cohort' as type, NULL as id, NULL as slug, NULL as title, NULL as coverImage, NULL as position, NULL as sectionId, NULL as resourceId,
			cohortId, cohortSlug, cohortTitle, startsAt, endsAt, timezone, cohortTier, maxSeats,
			NULL as resourceType, NULL as resourcePosition
		FROM cohorts
		UNION ALL
		SELECT 'cohort_resource' as type, resourceId as id, resourceSlug as slug, resourceTitle as title, NULL as coverImage, resourcePosition as position,
			NULL as sectionId, NULL as resourceId,
			cohortId, NULL as cohortSlug, NULL as cohortTitle, startsAt, NULL as endsAt, NULL as timezone, NULL as cohortTier, NULL as maxSeats,
			resourceType, resourcePosition
		FROM cohort_resources
	`

	const result = await db.execute(query)

	if (!result.rows.length) {
		return null
	}

	// Parse and validate all rows with Zod
	const validatedRows = z.array(QueryResultRowSchema).parse(result.rows)

	// Find workshop metadata
	const workshopRow = validatedRows.find((row) => row.type === 'workshop')
	if (!workshopRow) return null

	// Parse individual rows with their specific schemas
	const workshop = WorkshopRawSchema.parse({
		id: workshopRow.id,
		slug: workshopRow.slug,
		title: workshopRow.title,
		coverImage: workshopRow.coverImage,
	})

	const sections = validatedRows
		.filter((row) => row.type === 'section')
		.map((row) =>
			SectionRawSchema.parse({
				id: row.id,
				slug: row.slug,
				title: row.title,
				position: row.position,
			}),
		)

	// Sort sections by position
	sections.sort((a, b) => a.position - b.position)

	const resources = validatedRows
		.filter((row) => row.type === 'resource')
		.map((row) =>
			ResourceRawSchema.parse({
				id: row.id,
				slug: row.slug || '',
				title: row.title,
				position: row.position,
				// Use the real resource type from the DB
				type: row.resourceType,
				sectionId: row.sectionId,
			}),
		)

	const solutions = validatedRows
		.filter((row) => row.type === 'solution')
		.map((row) =>
			SolutionRawSchema.parse({
				id: row.id,
				slug: row.slug,
				title: row.title,
				resourceId: row.resourceId,
			}),
		)

	const cohortRows = validatedRows.filter((row) => row.type === 'cohort')

	const cohortResourceRows = validatedRows.filter(
		(row) => row.type === 'cohort_resource',
	)

	// Group cohort resources by cohort ID
	const cohortResourcesByCohortId: Map<string, CohortResource[]> =
		cohortResourceRows.reduce((acc, row) => {
			// Only allow 'workshop' or 'tutorial' for cohort resources
			if (row.resourceType === 'workshop' || row.resourceType === 'tutorial') {
				if (!acc.has(row.cohortId!)) {
					acc.set(row.cohortId!, [])
				}
				const resource = {
					id: row.id!,
					slug: row.slug!,
					title: row.title!,
					position: row.resourcePosition!,
					type: row.resourceType,
					startsAt: row.startsAt || null,
				}
				acc.get(row.cohortId!)!.push(resource)
			}
			return acc
		}, new Map<string, CohortResource[]>())

	// Sort resources within each cohort by position
	cohortResourcesByCohortId.forEach((resources) => {
		resources.sort((a, b) => a.position - b.position)
	})

	const cohorts = cohortRows.map((row) => ({
		id: row.cohortId!,
		slug: row.cohortSlug!,
		title: row.cohortTitle!,
		startsAt: row.startsAt,
		endsAt: row.endsAt,
		timezone: row.timezone!,
		cohortTier: row.cohortTier,
		maxSeats: row.maxSeats,
		resources: cohortResourcesByCohortId.get(row.cohortId!) || [],
	}))

	// Transform the raw data into the navigation structure
	return transformToNavigationStructure(
		workshop,
		sections,
		resources,
		solutions,
		cohorts,
	)
}

/**
 * Transforms raw database results into the workshop navigation structure
 */
function transformToNavigationStructure(
	workshop: WorkshopRaw,
	sections: SectionRaw[],
	resources: ResourceRaw[],
	solutions: SolutionRaw[],
	cohorts: CohortInfo[],
): WorkshopNavigation {
	// Create a map of solutions by lesson ID for quick lookup
	const solutionsByLessonId = solutions.reduce((acc, solution) => {
		if (!acc.has(solution.resourceId)) {
			acc.set(solution.resourceId, [])
		}
		acc.get(solution.resourceId)!.push({
			id: solution.id,
			slug: solution.slug,
			title: solution.title,
			type: 'solution' as const,
		})
		return acc
	}, new Map<string, { id: string; slug: string; title: string; type: 'solution' }[]>())

	// Group resources by section first, without sorting
	const topLevelResources: ResourceRaw[] = []
	const resourcesBySectionId = new Map<string, ResourceRaw[]>()

	// First group resources by their section
	for (const resource of resources) {
		if (resource.sectionId) {
			if (!resourcesBySectionId.has(resource.sectionId)) {
				resourcesBySectionId.set(resource.sectionId, [])
			}
			resourcesBySectionId.get(resource.sectionId)!.push(resource)
		} else {
			topLevelResources.push(resource)
		}
	}

	// Sort top-level resources by position
	topLevelResources.sort((a, b) => a.position - b.position)

	// Sort resources within each section by position
	resourcesBySectionId.forEach((sectionResources) => {
		sectionResources.sort((a, b) => a.position - b.position)
	})

	// Transform top-level resources to NavigationResource objects
	const navigationTopLevelResources = topLevelResources.map((resource) => {
		const resourceSolutions =
			resource.type === 'lesson'
				? solutionsByLessonId.get(resource.id) || []
				: []

		return resource.type === 'lesson'
			? NavigationLessonSchema.parse({
					id: resource.id,
					slug: resource.slug,
					title: resource.title,
					position: resource.position,
					type: 'lesson',
					resources: resourceSolutions,
				})
			: NavigationPostSchema.parse({
					id: resource.id,
					slug: resource.slug,
					title: resource.title,
					position: resource.position,
					type: 'post',
				})
	})

	// Map sections to navigation sections with their resources
	const sectionResources = sections.map((section) => {
		const sectionRawResources = resourcesBySectionId.get(section.id) || []

		// Transform each resource in the section to a NavigationResource
		const sectionNavigationResources = sectionRawResources.map((resource) => {
			const resourceSolutions =
				resource.type === 'lesson'
					? solutionsByLessonId.get(resource.id) || []
					: []

			return resource.type === 'lesson'
				? NavigationLessonSchema.parse({
						id: resource.id,
						slug: resource.slug,
						title: resource.title,
						position: resource.position,
						type: 'lesson',
						resources: resourceSolutions,
					})
				: NavigationPostSchema.parse({
						id: resource.id,
						slug: resource.slug,
						title: resource.title,
						position: resource.position,
						type: 'post',
					})
		})

		return NavigationSectionSchema.parse({
			id: section.id,
			slug: section.slug,
			title: section.title,
			position: section.position,
			type: 'section',
			resources: sectionNavigationResources,
		})
	})

	// Combine top-level resources and sections, sorted by position
	const allResources = [...navigationTopLevelResources, ...sectionResources]
	allResources.sort((a, b) => a.position - b.position)

	const workshopNavigation = {
		id: workshop.id,
		slug: workshop.slug,
		title: workshop.title,
		coverImage: workshop.coverImage,
		resources: allResources,
		cohorts,
	}

	return WorkshopNavigationSchema.parse(workshopNavigation)
}

export const getCachedWorkshopNavigation = unstable_cache(
	async (slug: string) => getWorkshopNavigation(slug),
	['workshop'],
	{ revalidate: 3600, tags: ['workshop'] },
)

export async function getWorkshopNavigation(
	moduleSlugOrId: string,
	moduleType: 'tutorial' | 'workshop' = 'workshop',
): Promise<WorkshopNavigation | null> {
	const workshopNavigation = await getAllWorkshopLessonsWithSectionInfo(
		moduleSlugOrId,
		moduleType,
	)

	return workshopNavigation
}

export const getCachedWorkshopProduct = unstable_cache(
	async (workshopIdOrSlug: string) => getWorkshopProduct(workshopIdOrSlug),
	['workshop'],
	{ revalidate: 3600, tags: ['workshop'] },
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

export const getCachedMinimalWorkshop = unstable_cache(
	async (slug: string) => getMinimalWorkshop(slug),
	['workshop'],
	{ revalidate: 3600, tags: ['workshop'] },
)

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
			resources: {
				with: {
					resource: {
						with: {
							resources: {
								with: {
									resource: true,
								},
								orderBy: asc(contentResourceResource.position),
							},
						},
					},
				},
				orderBy: asc(contentResourceResource.position),
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

	revalidateTag('workshop', 'max')

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

	revalidateTag('workshop', 'max')
	revalidateTag('workshops', 'max')
	revalidateTag(currentWorkshop.id, 'max')
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
