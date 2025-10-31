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
 * Fields that should be preserved in navigation (excludes heavy content like body)
 */
const NAVIGATION_FIELDS = ['slug', 'title', 'visibility', 'state'] as const

/**
 * Strips heavy fields from a resource's fields object, keeping only navigation-required fields
 */
function stripHeavyFields(
	fields: Record<string, any> | null | undefined,
): Record<string, any> | null | undefined {
	if (!fields) return fields

	const stripped: Record<string, any> = {}
	for (const key of NAVIGATION_FIELDS) {
		if (key in fields && fields[key] !== undefined) {
			stripped[key] = fields[key]
		}
	}

	return Object.keys(stripped).length > 0 ? stripped : null
}

/**
 * Recursively strips heavy fields from nested resources
 */
function stripHeavyFieldsFromResource(resource: any): any {
	if (!resource) return resource

	const strippedFields = stripHeavyFields(resource.fields)

	const result = {
		...resource,
		fields: strippedFields,
	}

	if (resource.resources) {
		result.resources = resource.resources.map((wrapper: any) => ({
			...wrapper,
			resource: stripHeavyFieldsFromResource(wrapper.resource),
		}))
	}

	return result
}

/**
 * Fetches content navigation
 * Returns ContentResource with nested resources and optional parents (products)
 * Optimized to exclude heavy fields like body content for better performance
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

	// Strip heavy fields from main resource and nested resources
	const strippedResource = stripHeavyFieldsFromResource(resource)

	// Strip heavy fields from product resources
	const strippedProductRelations = productRelations.map((rel) => ({
		...rel,
		product: rel.product
			? {
					...rel.product,
					fields: stripHeavyFields(rel.product.fields),
					resources: rel.product.resources?.map((productRel) => ({
						...productRel,
						resource: productRel.resource
							? stripHeavyFieldsFromResource(productRel.resource)
							: productRel.resource,
					})),
				}
			: rel.product,
	}))

	// Validate the main resource
	const validatedResource = ResourceNavigationSchema.safeParse(strippedResource)
	if (!validatedResource.success) {
		console.error('Failed to parse resource:', validatedResource.error)
		return null
	}

	// Filter out videoResource types from nested resources
	const filteredResource = filterVideoResources(validatedResource.data)

	// Extract and validate products from relations
	const products = strippedProductRelations
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
