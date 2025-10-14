'use server'

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import {
	contentResource,
	contentResourceProduct,
	contentResourceResource,
} from '@/db/schema'
import { Module, ModuleSchema } from '@/lib/module'
import {
	NavigationLesson,
	NavigationLessonSchema,
	NavigationResource,
	NavigationResultSchema,
	NavigationResultSchemaArraySchema,
	NavigationSection,
	NavigationSectionSchema,
	WorkshopNavigation,
	WorkshopNavigationSchema,
} from '@/lib/workshops'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { and, asc, desc, eq, inArray, like, or, sql } from 'drizzle-orm'
import z from 'zod'

import { ContentResource, productSchema } from '@coursebuilder/core/schemas'
import { last } from '@coursebuilder/nodash'

async function getAllWorkshopLessonsWithSectionInfo(
	moduleSlugOrId: string,
	moduleType: 'tutorial' | 'workshop',
) {
	const result = await db.execute(sql`SELECT
    workshop.id AS workshop_id,
    workshop.fields->>'$.slug' AS workshop_slug,
    workshop.fields->>'$.title' AS workshop_title,
    workshop.fields->>'$.coverImage.url' AS workshop_image,
    CASE
        WHEN combined.item_type = 'section' THEN combined.section_id
        ELSE NULL
    END AS section_id,
    CASE
        WHEN combined.item_type = 'section' THEN combined.section_slug
        ELSE NULL
    END AS section_slug,
    CASE
        WHEN combined.item_type = 'section' THEN combined.section_title
        ELSE NULL
    END AS section_title,
    combined.position AS section_position,
    combined.item_type,
    combined.lesson_id,
    combined.lesson_slug,
    combined.lesson_title,
    combined.lesson_position
FROM
    ${contentResource} AS workshop
# all of the lessons in the workshop with section information
LEFT JOIN (
		# all the top-level lessons, not in a section
    SELECT
        workshop_id,
        NULL AS section_id,
        NULL AS section_slug,
        NULL AS section_title,
        lesson_id,
        lesson_slug,
        lesson_title,
        position,
        'lesson' AS item_type,
        position AS lesson_position
    FROM (
        SELECT
            workshop.id AS workshop_id,
            top_level_lessons.id AS lesson_id,
            top_level_lessons.fields->>'$.slug' AS lesson_slug,
            top_level_lessons.fields->>'$.title' AS lesson_title,
            top_level_lesson_relations.position
        FROM
            ${contentResource} AS workshop
        JOIN ${contentResourceResource} AS top_level_lesson_relations
            ON workshop.id = top_level_lesson_relations.resourceOfId
        JOIN ${contentResource} AS top_level_lessons
            ON top_level_lessons.id = top_level_lesson_relations.resourceId
            AND top_level_lessons.type = 'lesson'
        WHERE
            workshop.type = ${moduleType}
            AND workshop.fields->>'$.slug' = ${moduleSlugOrId}
    ) AS workshop_lessons

    UNION ALL

		# all the lessons that are in a section
    SELECT
        workshop_id,
        section_id,
        section_slug,
        section_title,
        lesson_id,
        lesson_slug,
        lesson_title,
        section_position AS position,
        'section' AS item_type,
        lesson_position
    FROM (
        SELECT
            workshop.id AS workshop_id,
            lessons.id AS lesson_id,
            lessons.fields->>'$.slug' AS lesson_slug,
            lessons.fields->>'$.title' AS lesson_title,
            lesson_relations.position AS lesson_position,
            sections.id AS section_id,
            sections.fields->>'$.slug' AS section_slug,
            sections.fields->>'$.title' AS section_title,
            section_relations.position AS section_position
        FROM
            ${contentResource} AS workshop
        JOIN ${contentResourceResource} AS section_relations
            ON workshop.id = section_relations.resourceOfId
        JOIN ${contentResource} AS sections
            ON sections.id = section_relations.resourceId AND sections.type = 'section'
        LEFT JOIN ${contentResourceResource}  AS lesson_relations
            ON sections.id = lesson_relations.resourceOfId
        LEFT JOIN ${contentResource} AS lessons
            ON lessons.id = lesson_relations.resourceId AND lessons.type = 'lesson'
        WHERE
            workshop.type = ${moduleType}
            AND workshop.fields->>'$.slug' = ${moduleSlugOrId}
    ) AS section_lessons
) AS combined
ON workshop.id = combined.workshop_id
WHERE
    workshop.type = ${moduleType}
    AND workshop.fields->>'$.slug' = ${moduleSlugOrId}
ORDER BY
    combined.position,
    combined.lesson_position`)

	return NavigationResultSchemaArraySchema.parse(result.rows)
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
	const workshopNavigationResult = await getAllWorkshopLessonsWithSectionInfo(
		moduleSlugOrId,
		moduleType,
	)

	if (workshopNavigationResult.length === 0) {
		return null
	}

	const workshop = NavigationResultSchema.parse(workshopNavigationResult[0])

	const sectionsMap = new Map<string, NavigationSection>()
	const resources: NavigationResource[] = []

	workshopNavigationResult.forEach((item) => {
		if (item.item_type === 'lesson' && item.lesson_id) {
			const newLesson: NavigationLesson = NavigationLessonSchema.parse({
				id: item.lesson_id,
				slug: item.lesson_slug,
				title: item.lesson_title,
				position: item.lesson_position,
				type: 'lesson',
			})

			resources.push(newLesson)
		} else if (item.section_id) {
			if (!sectionsMap.has(item.section_id)) {
				const newSection: NavigationSection = NavigationSectionSchema.parse({
					id: item.section_id,
					slug: item.section_slug,
					title: item.section_title,
					position: item.section_position,
					type: 'section',
					lessons: [],
				})
				sectionsMap.set(item.section_id, newSection)
				resources.push(newSection)
			}
			if (item.lesson_id) {
				const newLesson: NavigationLesson = NavigationLessonSchema.parse({
					id: item.lesson_id,
					slug: item.lesson_slug,
					title: item.lesson_title,
					position: item.lesson_position,
					type: 'lesson',
				})
				sectionsMap.get(item.section_id)?.lessons.push(newLesson)
			}
		}
	})

	// Sort resources and lessons within sections
	resources.sort((a, b) => a.position - b.position)
	resources.forEach((resource) => {
		if (resource.type === 'section') {
			resource.lessons.sort((a, b) => a.position - b.position)
		}
	})

	return WorkshopNavigationSchema.parse({
		id: workshop.workshop_id,
		slug: workshop.workshop_slug,
		title: workshop.workshop_title,
		coverImage: workshop.workshop_image,
		resources,
	})
}

export async function getWorkshopProduct(workshopIdOrSlug: string) {
	const query = sql`
		SELECT p.*
		FROM ${contentResource} cr
		LEFT JOIN ${contentResourceProduct} crp ON cr.id = crp.resourceId
		LEFT JOIN Product p ON crp.productId = p.id
		WHERE cr.id = ${workshopIdOrSlug}
			OR JSON_UNQUOTE(JSON_EXTRACT(cr.fields, '$.slug')) = ${workshopIdOrSlug}
		LIMIT 1;`
	const results = await db.execute(query)

	const parsedProduct = productSchema.safeParse(results.rows[0])

	if (!parsedProduct.success) {
		console.error('Error parsing product', parsedProduct.error)
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

	revalidateTag('workshop', 'max')
	revalidateTag('workshops', 'max')
	revalidateTag(currentWorkshop.id, 'max')
	revalidatePath('/workshops')

	return {
		...updatedWorkshop,
		resources: {},
	}
}
