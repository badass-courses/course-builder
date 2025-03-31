'use server'

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import {
	contentResource,
	contentResourceProduct,
	contentResourceResource,
	products as productTable,
} from '@/db/schema'
import { Module, ModuleSchema } from '@/lib/module'
import {
	NavigationLessonSchema,
	NavigationPostSchema,
	NavigationResource,
	NavigationSectionSchema,
	QueryResultRowSchema,
	ResourceRawSchema,
	SectionRawSchema,
	SolutionRawSchema,
	WorkshopNavigation,
	WorkshopNavigationSchema,
	WorkshopRawSchema,
	type ResourceRaw,
	type SectionRaw,
	type SolutionRaw,
	type WorkshopRaw,
} from '@/lib/workshops'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { and, asc, desc, eq, inArray, like, or, sql } from 'drizzle-orm'
import z from 'zod'

import { ContentResource, productSchema } from '@coursebuilder/core/schemas'
import { last } from '@coursebuilder/nodash'

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
			ORDER BY crr.position
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
		-- Get all data in separate result sets
		SELECT 'workshop' as type, id, slug, title, coverImage, NULL as position, NULL as sectionId, NULL as resourceId FROM workshop
		UNION ALL
		SELECT 'section' as type, id, slug, title, NULL as coverImage, position, NULL as sectionId, NULL as resourceId FROM sections
		UNION ALL
		SELECT 'resource' as type, id, slug, title, NULL as coverImage, position, sectionId, NULL as resourceId FROM resources
		UNION ALL
		SELECT 'solution' as type, id, slug, title, NULL as coverImage, NULL as position, NULL as sectionId, resourceId FROM solutions
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

	const resources = validatedRows
		.filter((row) => row.type === 'resource')
		.map((row) =>
			ResourceRawSchema.parse({
				id: row.id,
				slug: row.slug,
				title: row.title,
				position: row.position,
				// We need to determine if it's a post or lesson
				type: row.slug.includes('post') ? 'post' : 'lesson',
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

	// Transform the raw data into the navigation structure
	return transformToNavigationStructure(
		workshop,
		sections,
		resources,
		solutions,
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

	// Group resources by section
	const resourcesBySectionId = resources.reduce((acc, resource) => {
		const key = resource.sectionId || 'top-level'
		if (!acc.has(key)) {
			acc.set(key, [])
		}

		// Add solutions to lessons
		const resourceSolutions =
			resource.type === 'lesson'
				? solutionsByLessonId.get(resource.id) || []
				: []

		const navigationResource: NavigationResource =
			resource.type === 'lesson'
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

		acc.get(key)!.push(navigationResource)
		return acc
	}, new Map<string, NavigationResource[]>())

	// Create section resources and top-level resources
	const topLevelResources = resourcesBySectionId.get('top-level') || []
	const sectionResources = sections.map((section) => {
		return NavigationSectionSchema.parse({
			id: section.id,
			slug: section.slug,
			title: section.title,
			position: section.position,
			type: 'section',
			resources: resourcesBySectionId.get(section.id) || [],
		})
	})

	// Combine and sort all resources
	const allResources = [...topLevelResources, ...sectionResources]
	allResources.sort((a, b) => a.position - b.position)
	const workshopNavigation = {
		id: workshop.id,
		slug: workshop.slug,
		title: workshop.title,
		coverImage: workshop.coverImage,
		resources: allResources,
	}

	// Create the final workshop navigation structure
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

export async function getWorkshopProduct(workshopIdOrSlug: string) {
	const query = sql`
		SELECT p.*
		FROM ${contentResource} cr
		LEFT JOIN ${contentResourceProduct} crp ON cr.id = crp.resourceId
		LEFT JOIN ${productTable} p ON crp.productId = p.id
		WHERE cr.id = ${workshopIdOrSlug}
			OR JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.slug')) = ${workshopIdOrSlug}
		LIMIT 1;`
	const results = await db.execute(query)

	const parsedProduct = productSchema.safeParse(results.rows[0])

	if (!parsedProduct.success) {
		console.debug('Error parsing product', parsedProduct.error)
		return null
	}

	return parsedProduct.data
}

export async function getMinimalWorkshop(moduleSlugOrId: string) {
	return db.query.contentResource.findFirst({
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
			type: true,
			fields: true,
		},
	})
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

	const parsedWorkshop = ModuleSchema.safeParse(workshop)
	if (!parsedWorkshop.success) {
		console.error('Error parsing workshop', workshop, parsedWorkshop.error)
		return null
	}

	return parsedWorkshop.data
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

	const parsedWorkshops = z.array(ModuleSchema).safeParse(workshops)
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

	revalidateTag('workshop')

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

	revalidateTag('workshop')

	return result
}

export async function updateWorkshop(input: Module) {
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

	if (input.fields.title !== currentWorkshop.fields.title) {
		const splitSlug = currentWorkshop?.fields.slug.split('~') || ['', guid()]
		workshopSlug = `${slugify(input.fields.title)}~${splitSlug[1] || guid()}`
	}

	const updatedWorkshop =
		await courseBuilderAdapter.updateContentResourceFields({
			id: currentWorkshop.id,
			fields: {
				...currentWorkshop.fields,
				...input.fields,
				slug: workshopSlug,
			},
		})

	revalidateTag('workshop')
	revalidateTag('workshops')
	revalidateTag(currentWorkshop.id)
	revalidatePath('/workshops')
	revalidatePath(`/workshops/${currentWorkshop.fields.slug}`)

	return {
		...updatedWorkshop,
		resources: {},
	}
}
