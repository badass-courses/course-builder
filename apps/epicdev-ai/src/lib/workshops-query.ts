'use server'

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import {
	contentResource,
	contentResourceProduct,
	contentResourceResource,
	products as productTable,
} from '@/db/schema'
import { CohortSchema } from '@/lib/cohort'
import {
	CohortResource,
	ExerciseRawSchema,
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
	type ExerciseRaw,
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

import { transformWorkshopToModuleSchema } from './transform-workshop-result'
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
		top_level_sections AS (
			-- Get top-level sections (directly under workshop)
			SELECT
				cr.id,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.slug')) as slug,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.title')) as title,
				crr.position,
				NULL as parentSectionId
			FROM ${contentResource} as cr
			JOIN ${contentResourceResource} as crr ON cr.id = crr.resourceId
			JOIN workshop ON workshop.id = crr.resourceOfId
			WHERE cr.type = 'section'
		),
		sub_sections AS (
			-- Get sub-sections (sections within sections)
			SELECT
				cr.id,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.slug')) as slug,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.title')) as title,
				crr.position,
				crr.resourceOfId as parentSectionId
			FROM ${contentResource} as cr
			JOIN ${contentResourceResource} as crr ON cr.id = crr.resourceId
			JOIN top_level_sections ON top_level_sections.id = crr.resourceOfId
			WHERE cr.type = 'section'
		),
		sections AS (
			-- Combine all sections
			SELECT * FROM top_level_sections
			UNION ALL
			SELECT * FROM sub_sections
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
		),
		exercises AS (
			-- Get exercises for lessons
			SELECT
				cr.id,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.slug')) as slug,
				JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.title')) as title,
				crr.resourceOfId as resourceId
			FROM ${contentResource} as cr
			JOIN ${contentResourceResource} as crr ON cr.id = crr.resourceId
			JOIN resources ON resources.id = crr.resourceOfId AND resources.type = 'lesson'
			WHERE cr.type = 'exercise'
		)
		-- Get all data in separate result sets without complex ordering
		SELECT 'workshop' as type, id, slug, title, coverImage, NULL as position, NULL as sectionId, NULL as parentSectionId, NULL as resourceId,
			NULL as cohortId, NULL as cohortSlug, NULL as cohortTitle, NULL as startsAt, NULL as endsAt, NULL as timezone, NULL as cohortTier, NULL as maxSeats,
			NULL as resourceType, NULL as resourcePosition
		FROM workshop
		UNION ALL
		SELECT 'section' as type, id, slug, title, NULL as coverImage, position, NULL as sectionId, parentSectionId, NULL as resourceId,
			NULL as cohortId, NULL as cohortSlug, NULL as cohortTitle, NULL as startsAt, NULL as endsAt, NULL as timezone, NULL as cohortTier, NULL as maxSeats,
			NULL as resourceType, NULL as resourcePosition
		FROM sections
		UNION ALL
		SELECT 'resource' as type, id, slug, title, NULL as coverImage, position, sectionId, NULL as parentSectionId, NULL as resourceId,
			NULL as cohortId, NULL as cohortSlug, NULL as cohortTitle, NULL as startsAt, NULL as endsAt, NULL as timezone, NULL as cohortTier, NULL as maxSeats,
			type as resourceType, NULL as resourcePosition
		FROM resources
		UNION ALL
		SELECT 'solution' as type, id, slug, title, NULL as coverImage, NULL as position, NULL as sectionId, NULL as parentSectionId, resourceId,
			NULL as cohortId, NULL as cohortSlug, NULL as cohortTitle, NULL as startsAt, NULL as endsAt, NULL as timezone, NULL as cohortTier, NULL as maxSeats,
			NULL as resourceType, NULL as resourcePosition
		FROM solutions
		UNION ALL
		SELECT 'exercise' as type, id, slug, title, NULL as coverImage, NULL as position, NULL as sectionId, NULL as parentSectionId, resourceId,
			NULL as cohortId, NULL as cohortSlug, NULL as cohortTitle, NULL as startsAt, NULL as endsAt, NULL as timezone, NULL as cohortTier, NULL as maxSeats,
			NULL as resourceType, NULL as resourcePosition
		FROM exercises
		UNION ALL
		SELECT 'cohort' as type, NULL as id, NULL as slug, NULL as title, NULL as coverImage, NULL as position, NULL as sectionId, NULL as parentSectionId, NULL as resourceId,
			cohortId, cohortSlug, cohortTitle, startsAt, endsAt, timezone, cohortTier, maxSeats,
			NULL as resourceType, NULL as resourcePosition
		FROM cohorts
		UNION ALL
		SELECT 'cohort_resource' as type, resourceId as id, resourceSlug as slug, resourceTitle as title, NULL as coverImage, resourcePosition as position,
			NULL as sectionId, NULL as parentSectionId, NULL as resourceId,
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
				parentSectionId: row.parentSectionId,
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

	const exercises = validatedRows
		.filter((row) => row.type === 'exercise')
		.map((row) =>
			ExerciseRawSchema.parse({
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
		exercises,
		cohorts,
	)
}

/**
 * Transforms raw database results into the workshop navigation structure
 * Supports nested sections (sections within sections)
 */
function transformToNavigationStructure(
	workshop: WorkshopRaw,
	sections: SectionRaw[],
	resources: ResourceRaw[],
	solutions: SolutionRaw[],
	exercises: ExerciseRaw[],
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

	// Create a map of exercises by lesson ID for quick lookup
	const exercisesByLessonId = exercises.reduce((acc, exercise) => {
		if (!acc.has(exercise.resourceId)) {
			acc.set(exercise.resourceId, [])
		}
		acc.get(exercise.resourceId)!.push({
			id: exercise.id,
			slug: exercise.slug || '',
			title: exercise.title || '',
			type: 'exercise' as const,
		})
		return acc
	}, new Map<string, { id: string; slug: string; title: string; type: 'exercise' }[]>())

	// Group resources by section
	const topLevelResources: ResourceRaw[] = []
	const resourcesBySectionId = new Map<string, ResourceRaw[]>()

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

	// Group sections by parent section
	const topLevelSections: SectionRaw[] = []
	const subSectionsByParentId = new Map<string, SectionRaw[]>()

	for (const section of sections) {
		if (section.parentSectionId) {
			if (!subSectionsByParentId.has(section.parentSectionId)) {
				subSectionsByParentId.set(section.parentSectionId, [])
			}
			subSectionsByParentId.get(section.parentSectionId)!.push(section)
		} else {
			topLevelSections.push(section)
		}
	}

	// Sort sub-sections by position within each parent
	subSectionsByParentId.forEach((subSections) => {
		subSections.sort((a, b) => a.position - b.position)
	})

	/**
	 * Helper to transform a resource (lesson/post) to its navigation schema
	 */
	const transformResource = (resource: ResourceRaw) => {
		if (resource.type === 'lesson') {
			const resourceSolutions = solutionsByLessonId.get(resource.id) || []
			const resourceExercises = exercisesByLessonId.get(resource.id) || []
			const allResources = [...resourceExercises, ...resourceSolutions]

			return NavigationLessonSchema.parse({
				id: resource.id,
				slug: resource.slug,
				title: resource.title,
				position: resource.position,
				type: 'lesson',
				resources: allResources,
			})
		} else {
			return NavigationPostSchema.parse({
				id: resource.id,
				slug: resource.slug,
				title: resource.title,
				position: resource.position,
				type: 'post',
			})
		}
	}

	/**
	 * Recursively build a section with its nested sub-sections and resources
	 */
	const buildSection = (
		section: SectionRaw,
	): z.infer<typeof NavigationSectionSchema> => {
		const sectionRawResources = resourcesBySectionId.get(section.id) || []
		const childSections = subSectionsByParentId.get(section.id) || []

		// Transform resources in this section
		const transformedResources = sectionRawResources.map(transformResource)

		// Recursively build child sections
		const transformedChildSections = childSections.map(buildSection)

		// Combine resources and child sections, sorting by position
		const allSectionContents = [
			...transformedResources,
			...transformedChildSections,
		].sort((a, b) => a.position - b.position)

		return NavigationSectionSchema.parse({
			id: section.id,
			slug: section.slug,
			title: section.title,
			position: section.position,
			type: 'section',
			resources: allSectionContents,
		})
	}

	// Transform top-level resources
	const navigationTopLevelResources = topLevelResources.map(transformResource)

	// Build top-level sections (with nested sub-sections)
	const navigationSections = topLevelSections.map(buildSection)

	// Combine top-level resources and sections, sorted by position
	const allResources = [...navigationTopLevelResources, ...navigationSections]
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
	['workshop-navigation'],
	{ revalidate: 60, tags: ['workshop', 'workshop-navigation'] },
)

export async function getWorkshopNavigation(
	moduleSlugOrId: string,
	moduleType: 'tutorial' | 'workshop' = 'workshop',
): Promise<WorkshopNavigation | null> {
	// Special case: For "epic-mcp-from-scratch-to-production", we need to show content from all workshops in the product
	if (moduleSlugOrId === 'epic-mcp-from-scratch-to-production') {
		const multiNav = await getMultiWorkshopNavigation(
			moduleSlugOrId,
			moduleType,
		)
		// If multi-workshop navigation fails or returns empty, fall back to single workshop
		if (multiNav && multiNav.resources && multiNav.resources.length > 0) {
			return multiNav
		}
		await log.warn(
			'getWorkshopNavigation: multi-workshop navigation returned empty, falling back to single workshop',
			{ moduleSlugOrId },
		)
	}

	const workshopNavigation = await getAllWorkshopLessonsWithSectionInfo(
		moduleSlugOrId,
		moduleType,
	)

	return workshopNavigation
}

/**
 * Get navigation data combining all workshops in a product
 * Used for multi-workshop products like "epic-mcp-from-scratch-to-production"
 */
async function getMultiWorkshopNavigation(
	moduleSlugOrId: string,
	moduleType: 'tutorial' | 'workshop' = 'workshop',
): Promise<WorkshopNavigation | null> {
	const allWorkshops = await getAllWorkshopsInProduct(moduleSlugOrId)

	await log.info('getMultiWorkshopNavigation', {
		moduleSlugOrId,
		workshopsFound: allWorkshops.length,
		workshopIds: allWorkshops.map((w) => w.id),
		workshopSlugs: allWorkshops.map((w) => w.fields?.slug || w.id),
	})

	if (allWorkshops.length === 0) {
		// Fallback to single workshop if no product found
		await log.info(
			'getMultiWorkshopNavigation: no workshops in product, falling back to single workshop',
			{ moduleSlugOrId },
		)
		return await getAllWorkshopLessonsWithSectionInfo(
			moduleSlugOrId,
			moduleType,
		)
	}

	// Get navigation for each workshop
	const navigationPromises = allWorkshops.map((workshop) =>
		getAllWorkshopLessonsWithSectionInfo(
			workshop.fields?.slug || workshop.id,
			moduleType,
		),
	)

	const navigations = await Promise.all(navigationPromises)
	const validNavigations = navigations.filter(
		(nav): nav is WorkshopNavigation => nav !== null,
	)

	await log.info('getMultiWorkshopNavigation: navigations', {
		totalNavigations: navigations.length,
		validNavigations: validNavigations.length,
		resourcesCounts: validNavigations.map((nav) => nav.resources?.length || 0),
	})

	if (validNavigations.length === 0) {
		await log.error('getMultiWorkshopNavigation: no valid navigations found', {
			moduleSlugOrId,
			totalNavigations: navigations.length,
		})
		return null
	}

	// Use the first workshop as the base (the one being viewed)
	const baseNavigation = validNavigations[0]
	if (!baseNavigation) {
		await log.error('getMultiWorkshopNavigation: baseNavigation is null', {
			moduleSlugOrId,
		})
		return null
	}

	// Group resources by workshop - create a section for each workshop
	const workshopSections: any[] = []
	const seenResourceIds = new Set<string>()

	for (let i = 0; i < validNavigations.length; i++) {
		const nav = validNavigations[i]
		const workshop = allWorkshops[i]

		if (!nav || !workshop) continue

		const workshopTitle = workshop.fields?.title || nav.title || 'Workshop'
		const workshopSlug = workshop.fields?.slug || workshop.id

		// Get all resources from this workshop
		const workshopResources: any[] = []
		if (nav.resources && nav.resources.length > 0) {
			for (const resource of nav.resources) {
				if (!seenResourceIds.has(resource.id)) {
					// Update lesson slugs to point to the correct workshop
					const updatedResource = updateResourceWorkshopSlug(
						resource,
						workshopSlug,
					)
					workshopResources.push(updatedResource)
					seenResourceIds.add(resource.id)
				}
			}
		}

		if (workshopResources.length > 0) {
			// Create a section for this workshop
			const workshopSection: any = {
				id: `workshop-section-${workshop.id}`,
				slug: `workshop-${workshopSlug}`,
				title: workshopTitle,
				position: i,
				type: 'section' as const,
				resources: workshopResources,
				// Store the actual workshop slug for linking
				_workshopSlug: workshopSlug,
			}

			workshopSections.push(workshopSection)
		}
	}

	await log.info('getMultiWorkshopNavigation: combined resources', {
		totalWorkshopSections: workshopSections.length,
		resourcesPerSection: workshopSections.map((s) => s.resources.length),
	})

	// Return combined navigation with workshop sections
	const result = {
		...baseNavigation,
		resources: workshopSections,
	}

	await log.info('getMultiWorkshopNavigation: returning result', {
		resultResourcesCount: result.resources.length,
	})

	return result
}

/**
 * Recursively update resource slugs to point to the correct workshop
 * This ensures links work correctly when content is from a different workshop
 */
function updateResourceWorkshopSlug(resource: any, workshopSlug: string): any {
	if (resource.type === 'section') {
		// Recursively update nested resources in sections
		return {
			...resource,
			resources: resource.resources.map((r: any) =>
				updateResourceWorkshopSlug(r, workshopSlug),
			),
		}
	} else if (resource.type === 'lesson' || resource.type === 'post') {
		// For lessons and posts, we keep the original slug but store the workshop slug
		// The WorkshopResourceList component will use params.module for the URL
		return {
			...resource,
			// Store the original workshop slug for reference
			_workshopSlug: workshopSlug,
		}
	}
	return resource
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

/**
 * Get all workshops/resources in a product for a given workshop
 * This is used for multi-workshop products where we need to show content from all workshops
 */
export async function getAllWorkshopsInProduct(
	workshopIdOrSlug: string,
): Promise<ContentResource[]> {
	const product = await getWorkshopProduct(workshopIdOrSlug)

	if (!product) {
		return []
	}

	// Get all resources associated with this product
	const productResources = await db.query.contentResourceProduct.findMany({
		where: eq(contentResourceProduct.productId, product.id),
		with: {
			resource: true,
		},
		orderBy: asc(contentResourceProduct.position),
	})

	// Filter to only workshops and return them
	const workshops = productResources
		.map((pr) => pr.resource)
		.filter((resource) => resource.type === 'workshop')

	return workshops as ContentResource[]
}

export async function getWorkshopCohort(workshopIdOrSlug: string) {
	// This query finds the cohort associated with a workshop
	// Workshop -> Cohort relationship via contentResourceResource table

	const query = sql`
	SELECT cr_cohort.*
	FROM ${contentResource} cr_workshop
	-- Link workshop to its parent resource (which should be a cohort)
	JOIN ${contentResourceResource} crr ON cr_workshop.id = crr.resourceId
	-- The parent resource, ensuring it's a cohort
	JOIN ${contentResource} cr_cohort ON crr.resourceOfId = cr_cohort.id AND cr_cohort.type = 'cohort'
	WHERE
		(cr_workshop.id = ${workshopIdOrSlug} OR JSON_UNQUOTE(JSON_EXTRACT(cr_workshop.fields, '$.slug')) = ${workshopIdOrSlug})
		AND cr_workshop.type = 'workshop'
	LIMIT 1;`

	const results = await db.execute(query)
	const result = results.rows[0]

	if (!result) {
		return null
	}

	// Parse and return the typed cohort resource
	const parsedCohort = CohortSchema.safeParse(result)

	if (!parsedCohort.success) {
		console.debug('Error parsing cohort', parsedCohort.error)
		return null
	}

	return parsedCohort.data
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

export async function getWorkshopViaApi(moduleSlugOrId: string) {
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

		with: {
			resources: {
				with: {
					resource: {
						with: {
							resources: {
								with: {
									resource: {
										extras: {
											fields: sql<
												Record<string, any>
											>`JSON_REMOVE(${contentResource.fields}, '$.muxPlaybackId', '$.transcript', '$.wordLevelSrt', '$.srt', '$.deepgramResults', '$.muxAssetId', '$.originalMediaUrl')`.as(
												'fields',
											),
										},
										with: {
											resources: {
												with: {
													resource: {
														extras: {
															fields: sql<
																Record<string, any>
															>`JSON_REMOVE(${contentResource.fields}, '$.muxPlaybackId', '$.transcript', '$.wordLevelSrt', '$.srt', '$.deepgramResults', '$.muxAssetId', '$.originalMediaUrl')`.as(
																'fields',
															),
														},
													},
												},
											},
										},
									},
								},
								orderBy: asc(contentResourceResource.position),
							},
						},
					},
				},
				orderBy: asc(contentResourceResource.position),
			},
		},
	})

	if (!workshop) {
		return null
	}

	// Transform nested resources to apply field sanitization
	const transformResource = (resource: any): any => {
		if (!resource) return resource

		const transformed = { ...resource }

		// Transform nested resources
		if (resource.resources) {
			transformed.resources = resource.resources.map(
				(resourceRelation: any) => ({
					...resourceRelation,
					resource: transformResource(resourceRelation.resource),
				}),
			)
		}

		return transformed
	}

	const sanitizedWorkshop = transformResource(workshop)

	// Transform to ModuleSchema format
	const transformedWorkshop = transformWorkshopToModuleSchema(sanitizedWorkshop)

	console.log('workshop', transformedWorkshop)

	return transformedWorkshop
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
								// lessons in section OR nested sections
								with: {
									resource: {
										// For nested sections, fetch their children too
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
								// lessons in section OR nested sections
								with: {
									resource: {
										// For nested sections, fetch their children too
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
