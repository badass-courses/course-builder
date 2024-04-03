'use server'

import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { TutorialSchema } from '@/lib/tutorial'
import { and, asc, eq, like, or, sql } from 'drizzle-orm'
import { last } from 'lodash'

import { ContentResource } from '@coursebuilder/core/types'

export async function getTutorial(moduleSlugOrId: string) {
	const tutorial = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(
					sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
					moduleSlugOrId,
				),
				eq(contentResource.id, moduleSlugOrId),
			),
			eq(contentResource.type, 'tutorial'),
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
	})

	const parsedTutorial = TutorialSchema.safeParse(tutorial)
	if (!parsedTutorial.success) {
		console.error('Error parsing tutorial', tutorial)
		throw new Error('Error parsing tutorial')
	}

	return parsedTutorial.data
}

export const addResourceToTutorial = async ({
	resource,
	tutorialId,
}: {
	resource: ContentResource
	tutorialId: string
}) => {
	const tutorial = await db.query.contentResource.findFirst({
		where: like(contentResource.id, `%${last(tutorialId.split('-'))}%`),
		with: {
			resources: true,
		},
	})

	if (!tutorial) {
		throw new Error(`Tutorial with id ${tutorialId} not found`)
	}
	console.log('resource', resource)

	await db.insert(contentResourceResource).values({
		resourceOfId: tutorial.id,
		resourceId: resource.id,
		position: tutorial.resources.length,
	})

	return db.query.contentResourceResource.findFirst({
		where: and(
			eq(contentResourceResource.resourceOfId, tutorial.id),
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
	console.log('updateResourcePosition', {
		parentResourceId,
		resourceId,
		position,
	})
	const result = await db
		.update(contentResourceResource)
		.set({ position, resourceOfId: parentResourceId })
		.where(
			and(
				eq(contentResourceResource.resourceOfId, currentParentResourceId),
				eq(contentResourceResource.resourceId, resourceId),
			),
		)

	console.log(result)
	return result
}
