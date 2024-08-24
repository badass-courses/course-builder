'use server'

import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { ModuleSchema } from '@/lib/module'
import { getServerAuthSession } from '@/server/auth'
import { and, asc, eq, inArray, like, or, sql } from 'drizzle-orm'
import { last } from 'lodash'

import type { ContentResource } from '@coursebuilder/core/schemas'

export async function getModule(moduleSlugOrId: string) {
	const { ability } = await getServerAuthSession()

	const visibility: ('public' | 'private' | 'unlisted')[] = ability.can(
		'update',
		'Content',
	)
		? ['public', 'private', 'unlisted']
		: ['public', 'unlisted']

	const moduleData = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(
					sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
					moduleSlugOrId,
				),
				eq(contentResource.id, moduleSlugOrId),
			),
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

	const parsedModule = ModuleSchema.safeParse(moduleData)
	if (!parsedModule.success) {
		console.error('Error parsing module', moduleData, parsedModule.error)
		return null
	}

	return parsedModule.data
}

export const addResourceToModule = async ({
	resource,
	moduleId,
}: {
	resource: ContentResource
	moduleId: string
}) => {
	const moduleData = await db.query.contentResource.findFirst({
		where: like(contentResource.id, `%${last(moduleId.split('-'))}%`),
		with: {
			resources: true,
		},
	})

	if (!moduleData) {
		throw new Error(`Module with id ${moduleId} not found`)
	}
	console.log('resource', resource)

	await db.insert(contentResourceResource).values({
		resourceOfId: module.id,
		resourceId: resource.id,
		position: moduleData.resources.length,
	})

	return db.query.contentResourceResource.findFirst({
		where: and(
			eq(contentResourceResource.resourceOfId, module.id),
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
