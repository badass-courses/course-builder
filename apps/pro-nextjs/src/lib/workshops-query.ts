'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { Module, ModuleSchema } from '@/lib/module'
import {
	NavigationResultSchema,
	NavigationResultSchemaArraySchema,
	NavigationSection,
	WorkshopNavigation,
} from '@/lib/workshops'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { and, asc, desc, eq, inArray, like, or, sql } from 'drizzle-orm'
import { last } from 'lodash'
import z from 'zod'

import { ContentResource } from '@coursebuilder/core/types'

export async function getWorkshopNavigation(
	moduleSlugOrId: string,
): Promise<WorkshopNavigation | null> {
	const result = await db.execute(sql`SELECT
    workshop.id AS workshop_id,
    workshop.fields->>'$.slug' AS workshop_slug,
    workshop.fields->>'$.title' AS workshop_title,
    workshop.fields->>'$.coverImage.url' AS workshop_image,
    sections.id AS section_id,
    sections.fields->>'$.slug' AS section_slug,
    sections.fields->>'$.title' AS section_title,
    section_relations.\`position\` as section_position,
    lessons.id AS lesson_id,
    lessons.fields->>'$.slug' AS lesson_slug,
    lessons.fields->>'$.title' AS lesson_title,
    lesson_relations.position AS lesson_position
FROM
    ContentResource AS workshop
LEFT JOIN ContentResourceResource AS section_relations ON workshop.id = section_relations.resourceOfId
LEFT JOIN ContentResource AS sections ON sections.id = section_relations.resourceId
LEFT JOIN ContentResourceResource AS lesson_relations ON sections.id = lesson_relations.resourceOfId
LEFT JOIN ContentResource AS lessons ON lessons.id = lesson_relations.resourceId
WHERE
    workshop.type = 'workshop'
    AND workshop.fields->>'$.slug' = ${moduleSlugOrId}
    AND sections.type = 'section'
    AND lessons.type = 'lesson'
ORDER BY
    section_relations.position,
    lesson_relations.position;`)

	const workshopNavigationResult = NavigationResultSchemaArraySchema.parse(
		result.rows,
	)

	const workshop = NavigationResultSchema.parse(result.rows[0]) // All items have the same workshop inf

	if (!workshop) {
		return null
	}

	const sections = workshopNavigationResult.reduce<
		Record<string, NavigationSection>
	>((acc, item) => {
		if (!acc[item.section_id]) {
			acc[item.section_id] = {
				id: item.section_id,
				slug: item.section_slug,
				title: item.section_title,
				position: item.section_position,
				lessons: [],
			}
		}

		acc[item.section_id]?.lessons.push({
			id: item.lesson_id,
			slug: item.lesson_slug,
			title: item.lesson_title,
			position: item.lesson_position,
		})

		return acc
	}, {})

	return {
		id: workshop.workshop_id,
		slug: workshop.workshop_slug,
		title: workshop.workshop_title,
		coverImage: workshop.workshop_image,
		sections: Object.values(sections)
			.sort((a: any, b: any) => a.position - b.position)
			.map((section: any) => ({
				...section,
				lessons: section.lessons.sort(
					(a: any, b: any) => a.position - b.position,
				),
			})),
	}
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
