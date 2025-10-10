'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { ModuleSchema, type Module } from '@/lib/module'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { and, asc, desc, eq, inArray, like, or, sql } from 'drizzle-orm'
import z from 'zod'

import { ContentResource } from '@coursebuilder/core/schemas'
import { last } from '@coursebuilder/nodash'

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
							},
						},
					},
				},
				orderBy: asc(contentResourceResource.position),
			},
		},
	})

	const parsedTutorial = ModuleSchema.safeParse(tutorial)
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

	// return tutorials

	const parsedTutorial = z.array(ModuleSchema).safeParse(tutorials)
	if (!parsedTutorial.success) {
		console.error('Error parsing tutorial', tutorials, parsedTutorial.error)
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

type positionInputIten = {
	currentParentResourceId: string
	parentResourceId: string
	resourceId: string
	position: number
	children?: positionInputIten[]
}

export const updateResourcePositions = async (input: positionInputIten[]) => {
	const result = await db.transaction(async (trx) => {
		for (const {
			currentParentResourceId,
			parentResourceId,
			resourceId,
			position,
			children,
		} of input) {
			await trx
				.update(contentResourceResource)
				.set({ position, resourceOfId: parentResourceId })
				.where(
					and(
						eq(contentResourceResource.resourceOfId, currentParentResourceId),
						eq(contentResourceResource.resourceId, resourceId),
					),
				)
			for (const child of children || []) {
				await trx
					.update(contentResourceResource)
					.set({
						position: child.position,
						resourceOfId: child.parentResourceId,
					})
					.where(
						and(
							eq(
								contentResourceResource.resourceOfId,
								child.currentParentResourceId,
							),
							eq(contentResourceResource.resourceId, child.resourceId),
						),
					)
			}
		}
	})

	return result
}

export const batchUpdateResourcePositions = async (
	updates: {
		resourceId: string
		resourceOfId: string
		currentParentResourceId: string
		position: number
		metadata?: any
	}[],
) => {
	if (!updates.length) return

	try {
		if (process.env.NODE_ENV === 'development') {
			console.log(`Batch updating ${updates.length} items...`)
		}

		const startTime = performance.now()

		const result = await db.transaction(async (trx) => {
			for (const update of updates) {
				await trx
					.update(contentResourceResource)
					.set({
						position: update.position,
						resourceOfId: update.resourceOfId,
						metadata: update.metadata,
					})
					.where(
						and(
							eq(contentResourceResource.resourceId, update.resourceId),
							eq(
								contentResourceResource.resourceOfId,
								update.currentParentResourceId,
							),
						),
					)
			}
		})

		const duration = performance.now() - startTime

		if (process.env.NODE_ENV === 'development') {
			console.log(`Batch update completed in ${duration.toFixed(2)}ms`)
			console.log('Updates:', updates)
			console.log('Result:', result)
		}

		return result
	} catch (error) {
		console.error('Error in batchUpdateResourcePositions:', error)
		throw new Error(
			`Failed to update resource positions: ${error instanceof Error ? error.message : 'Unknown error'}`,
		)
	}
}

export const updateResourcePosition = async ({
	currentParentResourceId,
	parentResourceId,
	resourceId,
	position,
	metadata,
}: {
	currentParentResourceId: string
	parentResourceId: string
	resourceId: string
	position: number
	metadata?: any
}) => {
	const parentIdToLookup = currentParentResourceId ?? parentResourceId
	const result = await db
		.update(contentResourceResource)
		.set({ position, resourceOfId: parentResourceId, metadata })
		.where(
			and(
				eq(contentResourceResource.resourceOfId, parentIdToLookup),
				eq(contentResourceResource.resourceId, resourceId),
			),
		)

	return result
}

export async function updateTutorial(input: Module) {
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

	revalidateTag('tutorials', 'max')
	revalidateTag(currentTutorial.id, 'max')
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
