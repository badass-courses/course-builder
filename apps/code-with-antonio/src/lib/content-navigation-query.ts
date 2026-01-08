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
const NAVIGATION_FIELDS = [
	'slug',
	'title',
	'visibility',
	'state',
	'startsAt',
	'timezone',
] as const

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
	console.error(
		`[getContentNavigation] Starting navigation fetch for: ${slugOrId}`,
	)
	const startTime = Date.now()

	try {
		console.error(
			`[getContentNavigation] Executing main resource query for: ${slugOrId}`,
		)
		const queryStartTime = Date.now()

		// Add timeout to prevent hanging queries during concurrent builds
		const queryPromise = db.query.contentResource.findFirst({
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

		// Add timeout (10 seconds) to prevent hanging during concurrent builds
		const timeoutPromise = new Promise<never>((_, reject) =>
			setTimeout(() => reject(new Error('Query timeout after 10s')), 10000),
		)

		const resource = await Promise.race([queryPromise, timeoutPromise])

		const queryDuration = Date.now() - queryStartTime
		console.error(
			`[getContentNavigation] ✅ Main resource query completed for ${slugOrId} in ${queryDuration}ms`,
		)

		if (!resource) {
			console.error(
				`[getContentNavigation] ⚠️ No resource found for: ${slugOrId}`,
			)
			return null
		}

		console.error(
			`[getContentNavigation] Found resource: ${resource.id} (type: ${resource.type})`,
		)
		console.error(
			`[getContentNavigation] Resource has ${resource.resources?.length || 0} top-level resources`,
		)

		// Log nesting depth to detect problematic structures
		if (resource.resources) {
			resource.resources.forEach((wrapper, idx) => {
				const level1Resource = wrapper.resource
				const level2Count = level1Resource?.resources?.length || 0
				let maxLevel3Count = 0

				if (level1Resource?.resources) {
					level1Resource.resources.forEach((level2Wrapper) => {
						const level2Resource = level2Wrapper.resource
						const level3Count = level2Resource?.resources?.length || 0
						maxLevel3Count = Math.max(maxLevel3Count, level3Count)
					})
				}

				console.error(
					`[getContentNavigation] Resource ${idx}: type=${level1Resource?.type}, level2=${level2Count}, maxLevel3=${maxLevel3Count}`,
				)
			})
		}

		console.error(
			`[getContentNavigation] Fetching product relations for: ${slugOrId}`,
		)

		// Fetch products containing this resource (directly or via parent resources)
		// First get direct product relations
		const directProductStartTime = Date.now()
		const directProductRelations =
			await db.query.contentResourceProduct.findMany({
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
			})
		console.error(
			`[getContentNavigation] Direct product relations fetched in ${Date.now() - directProductStartTime}ms (count: ${directProductRelations.length})`,
		)

		// Then check if this resource is nested under a parent (e.g., workshop under cohort)
		const parentRelationsStartTime = Date.now()
		const parentRelations = await db.query.contentResourceResource.findMany({
			where: eq(contentResourceResource.resourceId, resource.id),
		})
		console.error(
			`[getContentNavigation] Parent relations fetched in ${Date.now() - parentRelationsStartTime}ms (count: ${parentRelations.length})`,
		)

		// Get products for parent resources
		let parentProductRelationsResult: typeof directProductRelations = []
		if (parentRelations.length > 0) {
			console.error(
				`[getContentNavigation] Fetching products for ${parentRelations.length} parent relations`,
			)
			const parentProductStartTime = Date.now()
			parentProductRelationsResult =
				await db.query.contentResourceProduct.findMany({
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
			console.error(
				`[getContentNavigation] Parent product relations fetched in ${Date.now() - parentProductStartTime}ms (count: ${parentProductRelationsResult.length})`,
			)
		}

		const productRelations = [
			...directProductRelations,
			...parentProductRelationsResult,
		]

		console.error(
			`[getContentNavigation] Processing ${productRelations.length} total product relations`,
		)

		// Strip heavy fields from main resource and nested resources
		console.error(`[getContentNavigation] Stripping heavy fields from resource`)
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
		console.error(`[getContentNavigation] Validating resource structure`)
		const validatedResource =
			ResourceNavigationSchema.safeParse(strippedResource)
		if (!validatedResource.success) {
			console.error(
				`[getContentNavigation] ❌ Failed to parse resource for ${slugOrId}:`,
				validatedResource.error,
			)
			console.error(
				`[getContentNavigation] Validation errors:`,
				validatedResource.error.format(),
			)
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

		const totalDuration = Date.now() - startTime
		console.log(
			`[getContentNavigation] ✅ Successfully completed navigation fetch for ${slugOrId} in ${totalDuration}ms`,
		)

		return result
	} catch (error) {
		const totalDuration = Date.now() - startTime
		console.error(
			`[getContentNavigation] ❌ ERROR fetching navigation for ${slugOrId} after ${totalDuration}ms:`,
			error,
		)
		console.error(`[getContentNavigation] Error details:`, {
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			name: error instanceof Error ? error.name : undefined,
			slugOrId,
		})
		// Return null to allow page to render without navigation
		// This prevents build failures during static generation
		return null
	}
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
