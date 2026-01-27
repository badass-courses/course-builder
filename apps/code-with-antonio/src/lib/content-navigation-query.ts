'use server'

import { cache } from 'react'
import { db } from '@/db'
import {
	contentResource,
	contentResourceProduct,
	contentResourceResource,
} from '@/db/schema'
import { asc, eq, inArray, or, sql } from 'drizzle-orm'

import { productSchema } from '@coursebuilder/core/schemas'

import {
	ResourceNavigationSchema,
	type Level1ResourceWrapper,
	type Level2ResourceWrapper,
	type ResourceNavigation,
} from './content-navigation'
import {
	normalizeContentNavigationOptions,
	type ContentNavigationCaller,
	type ContentNavigationDepth,
	type ContentNavigationOptions,
} from './content-navigation-options'

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
	'coverImage',
] as const

const CONTENT_RESOURCE_ID_PREFIXES = [
	'cohort_',
	'lesson_',
	'list_',
	'post_',
	'section_',
	'solution_',
	'tutorial_',
	'videoResource_',
	'workshop_',
] as const

/**
 * Determines if a navigation input is already a resource id.
 */
const isContentResourceId = (value: string) =>
	CONTENT_RESOURCE_ID_PREFIXES.some((prefix) => value.startsWith(prefix))

/**
 * Resolves the root resource ID from a slug or ID.
 * Keeps the initial lookup minimal to reduce payload size.
 */
async function resolveRootResourceId(slugOrId: string) {
	if (isContentResourceId(slugOrId)) {
		return slugOrId
	}

	const rootIdResult = await db
		.select({ id: contentResource.id })
		.from(contentResource)
		.where(
			or(
				eq(sql`JSON_EXTRACT(${contentResource.fields}, "$.slug")`, slugOrId),
				eq(contentResource.id, slugOrId),
			),
		)
		.limit(1)

	return rootIdResult[0]?.id ?? null
}

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
 * Recursively strips heavy fields from nested resources.
 * Used for product resources which still use nested query patterns.
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
 * Fetches content navigation using flat queries to avoid nested subquery timeouts.
 * Returns ContentResource with nested resources and optional parents (products).
 * Optimized to exclude heavy fields like body content for better performance.
 *
 * Instead of one deeply nested Drizzle query that generates complex json_arrayagg,
 * we run multiple simple queries and build the tree in JavaScript.
 */
const getContentNavigationCached = cache(
	async (slugOrId: string, depth: ContentNavigationDepth) => {
		// Step 1: Resolve root id with a minimal query, then fetch the full resource
		const rootResourceId = await resolveRootResourceId(slugOrId)
		if (!rootResourceId) {
			return null
		}

		const rootResource = await db.query.contentResource.findFirst({
			where: eq(contentResource.id, rootResourceId),
		})

		if (!rootResource) {
			return null
		}

		const includeLevel2 = depth >= 2
		const includeLevel3 = depth >= 3

		// Step 2: Get level 1 relationships (root -> sections/lessons)
		const level1Relations = await db.query.contentResourceResource.findMany({
			where: eq(contentResourceResource.resourceOfId, rootResource.id),
			orderBy: asc(contentResourceResource.position),
		})

		const level1ResourceIds = level1Relations.map((r) => r.resourceId)

		// Step 3: Get level 1 resources
		const level1Resources =
			level1ResourceIds.length > 0
				? await db.query.contentResource.findMany({
						where: inArray(contentResource.id, level1ResourceIds),
					})
				: []

		// Step 4: Get level 2 relationships (sections/lessons -> lessons/solutions)
		const level2Relations =
			includeLevel2 && level1ResourceIds.length > 0
				? await db.query.contentResourceResource.findMany({
						where: inArray(
							contentResourceResource.resourceOfId,
							level1ResourceIds,
						),
						orderBy: asc(contentResourceResource.position),
					})
				: []

		const level2ResourceIds = level2Relations.map((r) => r.resourceId)

		// Step 5: Get level 2 resources
		const level2Resources =
			includeLevel2 && level2ResourceIds.length > 0
				? await db.query.contentResource.findMany({
						where: inArray(contentResource.id, level2ResourceIds),
					})
				: []

		// Step 6: Get level 3 relationships (lessons -> solutions)
		const level3Relations =
			includeLevel3 && level2ResourceIds.length > 0
				? await db.query.contentResourceResource.findMany({
						where: inArray(
							contentResourceResource.resourceOfId,
							level2ResourceIds,
						),
						orderBy: asc(contentResourceResource.position),
					})
				: []

		const level3ResourceIds = level3Relations.map((r) => r.resourceId)

		// Step 7: Get level 3 resources
		const level3Resources =
			includeLevel3 && level3ResourceIds.length > 0
				? await db.query.contentResource.findMany({
						where: inArray(contentResource.id, level3ResourceIds),
					})
				: []

		// Build lookup maps for efficient tree construction
		const level1ResourceMap = new Map(level1Resources.map((r) => [r.id, r]))
		const level2ResourceMap = new Map(level2Resources.map((r) => [r.id, r]))
		const level3ResourceMap = new Map(level3Resources.map((r) => [r.id, r]))

		// Group relations by parent
		const level2RelationsByParent = new Map<string, typeof level2Relations>()
		for (const rel of level2Relations) {
			const existing = level2RelationsByParent.get(rel.resourceOfId) || []
			existing.push(rel)
			level2RelationsByParent.set(rel.resourceOfId, existing)
		}

		const level3RelationsByParent = new Map<string, typeof level3Relations>()
		for (const rel of level3Relations) {
			const existing = level3RelationsByParent.get(rel.resourceOfId) || []
			existing.push(rel)
			level3RelationsByParent.set(rel.resourceOfId, existing)
		}

		// Build the nested structure from bottom up
		const buildLevel3Wrappers = (parentId: string) => {
			if (!includeLevel3) return []
			const relations = level3RelationsByParent.get(parentId) || []
			return relations
				.map((rel) => {
					const resource = level3ResourceMap.get(rel.resourceId)
					if (!resource) return null
					return {
						...rel,
						resource: {
							...resource,
							fields: stripHeavyFields(resource.fields),
						},
					}
				})
				.filter(Boolean)
		}

		const buildLevel2Wrappers = (parentId: string) => {
			if (!includeLevel2) return []
			const relations = level2RelationsByParent.get(parentId) || []
			return relations
				.map((rel) => {
					const resource = level2ResourceMap.get(rel.resourceId)
					if (!resource) return null
					return {
						...rel,
						resource: {
							...resource,
							fields: stripHeavyFields(resource.fields),
							resources: buildLevel3Wrappers(resource.id),
						},
					}
				})
				.filter(Boolean)
		}

		const buildLevel1Wrappers = () => {
			return level1Relations
				.map((rel) => {
					const resource = level1ResourceMap.get(rel.resourceId)
					if (!resource) return null
					return {
						...rel,
						resource: {
							...resource,
							fields: stripHeavyFields(resource.fields),
							resources: buildLevel2Wrappers(resource.id),
						},
					}
				})
				.filter(Boolean)
		}

		// Build the final resource structure
		const resource = {
			...rootResource,
			fields: stripHeavyFields(rootResource.fields),
			resources: buildLevel1Wrappers(),
		}

		// Fetch products containing this resource (directly or via parent resources)
		// First get direct product relations
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

		// Strip heavy fields from product resources (main resource already stripped during tree build)
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
		const validatedResource = ResourceNavigationSchema.safeParse(resource)
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
	},
)

/**
 * Fetches content navigation using flat queries to avoid nested subquery timeouts.
 * Returns ContentResource with nested resources and optional parents (products).
 * Optimized to exclude heavy fields like body content for better performance.
 *
 * Instead of one deeply nested Drizzle query that generates complex json_arrayagg,
 * we run multiple simple queries and build the tree in JavaScript.
 */
export async function getContentNavigation(
	slugOrId: string,
	options?: ContentNavigationOptions,
) {
	const normalizedOptions = normalizeContentNavigationOptions(options)
	return getContentNavigationCached(slugOrId, normalizedOptions.depth)
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
