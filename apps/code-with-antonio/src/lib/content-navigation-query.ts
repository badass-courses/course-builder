'use server'

import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { asc, eq, or, sql } from 'drizzle-orm'

import { ContentResourceSchema } from '@coursebuilder/core/schemas'
import type { ContentResource } from '@coursebuilder/core/schemas'

import {
	NestedContentResourceSchema,
	type Level1ResourceWrapper,
	type Level2ResourceWrapper,
	type NestedContentResource,
} from './content-navigation'

/**
 * Fetches content navigation
 * Returns ContentResource with nested resources and optional parents
 */
export async function getContentNavigation(slugOrId: string) {
	// Fetch main resource with all nested resources (2 levels deep)
	const resource = await db.query.contentResource.findFirst({
		where: or(
			eq(sql`JSON_EXTRACT(${contentResource.fields}, "$.slug")`, slugOrId),
			eq(contentResource.id, slugOrId),
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

	if (!resource) {
		return null
	}

	// Fetch parent resources (e.g., cohorts containing this resource)
	const parentRelations = await db.query.contentResourceResource.findMany({
		where: eq(contentResourceResource.resourceId, resource.id),
		with: {
			resourceOf: {
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
	})

	// Validate the main resource
	const validatedResource = NestedContentResourceSchema.safeParse(resource)
	if (!validatedResource.success) {
		console.error('Failed to parse resource:', validatedResource.error)
		return null
	}

	// Filter out videoResource types from nested resources
	const filteredResource = filterVideoResources(validatedResource.data)

	// Validate parent resources
	const parents = parentRelations
		.map((rel) => rel.resourceOf)
		.filter((p): p is NonNullable<typeof p> => p !== null && p !== undefined)
		.map((p) => ContentResourceSchema.safeParse(p))
		.filter((p): p is { success: true; data: ContentResource } => p.success)
		.map((p) => p.data)
		.filter((p) => p.type !== 'videoResource')
		.map((p) => filterParentResources(p))

	const result = {
		...filteredResource,
		parents: parents.length > 0 ? parents : undefined,
	}

	return result
}

/**
 * Filters out videoResource types from level 2 (deepest nested resources)
 */
function filterLevel2Resources(
	wrappers: Level2ResourceWrapper[] | null | undefined,
): Level2ResourceWrapper[] | null | undefined {
	if (!wrappers) return wrappers
	return wrappers.filter((wrapper) => wrapper.resource.type !== 'videoResource')
}

/**
 * Filters out videoResource types from level 1 resources and their nested resources
 */
function filterLevel1Resources(
	wrappers: Level1ResourceWrapper[] | null | undefined,
): Level1ResourceWrapper[] | null | undefined {
	if (!wrappers) return wrappers

	return wrappers
		.filter((wrapper) => wrapper.resource.type !== 'videoResource')
		.map((wrapper) => ({
			...wrapper,
			resource: {
				...wrapper.resource,
				resources: filterLevel2Resources(wrapper.resource.resources),
			},
		}))
}

/**
 * Filters out videoResource types from the entire navigation tree
 */
function filterVideoResources(
	data: NestedContentResource,
): NestedContentResource {
	return {
		...data,
		resources: filterLevel1Resources(data.resources),
	}
}

/**
 * Filters out videoResource types from parent ContentResource
 */
function filterParentResources(parent: ContentResource): ContentResource {
	if (!parent.resources) return parent

	return {
		...parent,
		resources: parent.resources.filter(
			(wrapper) =>
				wrapper.resource &&
				typeof wrapper.resource === 'object' &&
				'type' in wrapper.resource &&
				wrapper.resource.type !== 'videoResource',
		),
	}
}
