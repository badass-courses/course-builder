'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { notFound } from 'next/navigation'
import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { TutorialSchema, type Tutorial } from '@/lib/tutorial'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { and, asc, desc, eq, inArray, like, or, sql } from 'drizzle-orm'
import { last } from 'lodash'
import z from 'zod'

import { ContentResource } from '@coursebuilder/core/types'

export async function getTutorial(moduleSlugOrId: string) {
	const { ability } = await getServerAuthSession()

	const visibility: ('public' | 'private' | 'unlisted')[] = ability.can(
		'update',
		'Content',
	)
		? ['public', 'private', 'unlisted']
		: ['public', 'unlisted']

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
	})

	const parsedTutorial = TutorialSchema.safeParse(tutorial)
	if (!parsedTutorial.success) {
		console.error('Error parsing tutorial', tutorial, parsedTutorial.error)
		return null
	}

	return parsedTutorial.data
}

export async function getAllTutorials() {
	const { ability } = await getServerAuthSession()

	const visibility: ('public' | 'private' | 'unlisted')[] = ability.can(
		'update',
		'Content',
	)
		? ['public', 'private', 'unlisted']
		: ['public']

	const tutorials: ContentResource[] = await db.query.contentResource.findMany({
		where: and(
			eq(contentResource.type, 'tutorial'),
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

	const parsedTutorial = z.array(TutorialSchema).safeParse(tutorials)
	if (!parsedTutorial.success) {
		console.error('Error parsing tutorial', tutorials)
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

export async function updateTutorial(input: Tutorial) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('update', 'Content')) {
		throw new Error('Unauthorized')
	}

	const currentTutorial = await getTutorial(input.id)

	if (!currentTutorial) {
		throw new Error(`Tutorial with id ${input.id} not found.`)
	}

	let tutorialSlug = currentTutorial.fields.slug

	if (input.fields.title !== currentTutorial.fields.title) {
		const splitSlug = currentTutorial?.fields.slug.split('~') || ['', guid()]
		tutorialSlug = `${slugify(input.fields.title)}~${splitSlug[1] || guid()}`
	}

	revalidateTag('tutorials')
	revalidateTag(currentTutorial.id)
	revalidatePath('/tutorials')

	return courseBuilderAdapter.updateContentResourceFields({
		id: currentTutorial.id,
		fields: {
			...currentTutorial.fields,
			...input.fields,
			slug: tutorialSlug,
		},
	})
}
