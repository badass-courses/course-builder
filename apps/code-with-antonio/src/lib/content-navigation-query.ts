'use server'

import { db } from '@/db'
import {
	contentResource,
	contentResourceProduct,
	contentResourceResource,
} from '@/db/schema'
import { asc, eq, or, sql } from 'drizzle-orm'

import { productSchema } from '@coursebuilder/core/schemas'

import {
	ResourceNavigationSchema,
	type Level1ResourceWrapper,
	type Level2ResourceWrapper,
	type ResourceNavigation,
} from './content-navigation'

/**
 * Fetches content navigation
 * Returns ContentResource with nested resources and optional parents (products)
 */
export async function getContentNavigation(slugOrId: string) {
	// Fetch main resource with all nested resources (3 levels deep to include solutions)
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
					},
				},
				orderBy: asc(contentResourceResource.position),
			},
		},
	})

	if (!resource) {
		return null
	}

	// Fetch products containing this resource (directly or via parent resources)
	// First get direct product relations
	const directProductRelations = await db.query.contentResourceProduct.findMany(
		{
			where: eq(contentResourceProduct.resourceId, resource.id),
			with: {
				product: {
					with: {
						resources: {
							with: {
								resource: true,
							},
							orderBy: asc(contentResourceProduct.position),
						},
					},
				},
			},
		},
	)

	// Then check if this resource is nested under a parent (e.g., workshop under cohort)
	const parentRelations = await db.query.contentResourceResource.findMany({
		where: eq(contentResourceResource.resourceId, resource.id),
	})

	// Get products for parent resources
	const parentProductRelations =
		parentRelations.length > 0
			? await db.query.contentResourceProduct.findMany({
					where: or(
						...parentRelations.map((rel) =>
							eq(contentResourceProduct.resourceId, rel.resourceOfId),
						),
					),
					with: {
						product: {
							with: {
								resources: {
									with: {
										resource: true,
									},
									orderBy: asc(contentResourceProduct.position),
								},
							},
						},
					},
				})
			: []

	const productRelations = [
		...directProductRelations,
		...parentProductRelations,
	]

	// Validate the main resource
	const validatedResource = ResourceNavigationSchema.safeParse(resource)
	if (!validatedResource.success) {
		console.error('Failed to parse resource:', validatedResource.error)
		return null
	}

	// Filter out videoResource types from nested resources
	const filteredResource = filterVideoResources(validatedResource.data)

	// Extract and validate products from relations
	const products = productRelations
		.map((rel) => rel.product)
		.filter((p): p is NonNullable<typeof p> => p !== null && p !== undefined)
		.map((product) => productSchema.parse(product))

	const result = {
		...filteredResource,
		parents: products.length > 0 ? products : undefined,
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
function filterVideoResources(data: ResourceNavigation): ResourceNavigation {
	return {
		...data,
		resources: filterLevel1Resources(data.resources),
	}
}
