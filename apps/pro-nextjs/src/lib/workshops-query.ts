'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { Module, ModuleSchema } from '@/lib/module'
import {
	NavigationLesson,
	NavigationResource,
	NavigationResultSchema,
	NavigationResultSchemaArraySchema,
	NavigationSection,
	WorkshopNavigation,
	WorkshopNavigationSchema,
} from '@/lib/workshops'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { and, asc, desc, eq, inArray, like, or, sql } from 'drizzle-orm'
import { last } from 'lodash'
import z from 'zod'

import { productSchema } from '@coursebuilder/core/schemas'
import { ContentResource } from '@coursebuilder/core/types'

export async function getWorkshopNavigation(
	moduleSlugOrId: string,
): Promise<WorkshopNavigation | null> {
	const result = await db.execute(sql`SELECT DISTINCT
    workshop.id AS workshop_id,
    workshop.fields->>'$.slug' AS workshop_slug,
    workshop.fields->>'$.title' AS workshop_title,
    workshop.fields->>'$.coverImage.url' AS workshop_image,
    COALESCE(sections.id, top_level_lessons.id) AS section_or_lesson_id,
    COALESCE(sections.fields->>'$.slug', top_level_lessons.fields->>'$.slug') AS section_or_lesson_slug,
    COALESCE(sections.fields->>'$.title', top_level_lessons.fields->>'$.title') AS section_or_lesson_title,
    COALESCE(section_relations.position, top_level_lesson_relations.position) AS section_or_lesson_position,
    CASE
        WHEN COALESCE(sections.id, top_level_lessons.id) IS NULL THEN 'workshop'
        ELSE 'lesson'
    END AS item_type,
    lessons.id AS lesson_id,
    lessons.fields->>'$.slug' AS lesson_slug,
    lessons.fields->>'$.title' AS lesson_title,
    lesson_relations.position AS lesson_position
FROM
    ContentResource AS workshop
LEFT JOIN ContentResourceResource AS section_relations
    ON workshop.id = section_relations.resourceOfId
LEFT JOIN ContentResource AS sections
    ON sections.id = section_relations.resourceId AND sections.type = 'section'
LEFT JOIN ContentResourceResource AS lesson_relations
    ON sections.id = lesson_relations.resourceOfId
LEFT JOIN ContentResource AS lessons
    ON lessons.id = lesson_relations.resourceId AND lessons.type = 'lesson'
LEFT JOIN ContentResourceResource AS top_level_lesson_relations
    ON workshop.id = top_level_lesson_relations.resourceOfId
LEFT JOIN ContentResource AS top_level_lessons
    ON top_level_lessons.id = top_level_lesson_relations.resourceId
    AND top_level_lessons.type = 'lesson'
WHERE
    workshop.type = 'workshop'
    AND workshop.fields->>'$.slug' = ${moduleSlugOrId}
ORDER BY
    COALESCE(section_relations.position, top_level_lesson_relations.position),
    lesson_relations.position;`)

	const workshopNavigationResult = NavigationResultSchemaArraySchema.parse(
		result.rows,
	)

	if (workshopNavigationResult.length === 0) {
		return null
	}

	const workshop = NavigationResultSchema.parse(workshopNavigationResult[0])

	const sectionsMap = new Map<string, NavigationSection>()
	const resources: NavigationResource[] = []

	workshopNavigationResult.forEach((item) => {
		if (item.item_type === 'lesson') {
			const newLesson: NavigationLesson = {
				id: item.lesson_id || item.section_or_lesson_id!,
				slug: item.lesson_slug || item.section_or_lesson_slug!,
				title: item.lesson_title || item.section_or_lesson_title!,
				position: item.lesson_position || item.section_or_lesson_position!,
				type: 'lesson',
			}

			if (item.lesson_id && item.section_or_lesson_id) {
				// This lesson belongs to a section
				if (!sectionsMap.has(item.section_or_lesson_id)) {
					const newSection: NavigationSection = {
						id: item.section_or_lesson_id,
						slug: item.section_or_lesson_slug!,
						title: item.section_or_lesson_title!,
						position: item.section_or_lesson_position!,
						type: 'section',
						lessons: [],
					}
					sectionsMap.set(item.section_or_lesson_id, newSection)
					resources.push(newSection)
				}
				sectionsMap.get(item.section_or_lesson_id)!.lessons.push(newLesson)
			} else {
				// This is a top-level lesson
				resources.push(newLesson)
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
		FROM ContentResource cr
		LEFT JOIN ContentResourceProduct crp ON cr.id = crp.resourceId
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

export function getMinimalWorkshop(moduleSlugOrId: string) {
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

	return db.query.contentResourceResource.findFirst({
		where: and(
			eq(contentResourceResource.resourceOfId, workshop.id),
			eq(contentResourceResource.resourceId, resource.id),
		),
		with: {
			resource: true,
		},
	})
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

	revalidateTag('workshops')
	revalidateTag(currentWorkshop.id)
	revalidatePath('/workshops')

	return {
		...updatedWorkshop,
		resources: {},
	}
}
