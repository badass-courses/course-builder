import { z } from 'zod'

import {
	ContentResourceResourceSchema,
	ContentResourceSchema,
	productSchema,
	type ContentResource,
	type ContentResourceProduct,
} from '@coursebuilder/core/schemas'

// Define nested schemas from deepest to shallowest
const Level3ResourceWrapperSchema = ContentResourceResourceSchema.extend({
	resource: ContentResourceSchema,
})

const Level2ResourceWrapperSchema = ContentResourceResourceSchema.extend({
	resource: ContentResourceSchema.extend({
		resources: z.array(Level3ResourceWrapperSchema).nullable().optional(),
	}),
})

const Level1ResourceWrapperSchema = ContentResourceResourceSchema.extend({
	resource: ContentResourceSchema.extend({
		resources: z.array(Level2ResourceWrapperSchema).nullable().optional(),
	}),
})

export const ResourceNavigationSchema = ContentResourceSchema.extend({
	resources: z.array(Level1ResourceWrapperSchema).nullable().optional(),
	parents: z.array(productSchema).optional(),
})

export type ResourceNavigation = z.infer<typeof ResourceNavigationSchema>
export type Level1ResourceWrapper = z.infer<typeof Level1ResourceWrapperSchema>
export type Level2ResourceWrapper = z.infer<typeof Level2ResourceWrapperSchema>

/**
 * Helper function to find a section ID for a given resource slug
 */
export function findSectionIdForResourceSlug(
	navigation: ResourceNavigation | null,
	resourceSlug?: string | null,
): string | null {
	if (!navigation?.resources || !resourceSlug) return null

	for (const { resource } of navigation.resources) {
		if (resource.type === 'section' && resource.resources) {
			const found = resource.resources.find(
				(r) => r.resource.fields?.slug === resourceSlug,
			)
			if (found) {
				return resource.id
			}
		} else if (resource.fields?.slug === resourceSlug) {
			return null // Top-level resource
		}
	}
	return navigation.resources[0]?.resource.id || null
}

/**
 * Helper function to get the first resource slug
 */
export function getFirstResourceSlug(
	navigation: ResourceNavigation | null,
): string | null {
	if (!navigation?.resources) return null

	const firstResourceWrapper = navigation.resources[0]
	if (!firstResourceWrapper) return null

	const firstResource = firstResourceWrapper.resource
	if (firstResource.type === 'section' && firstResource.resources) {
		return firstResource.resources[0]?.resource.fields?.slug || null
	}

	return firstResource.fields?.slug || null
}

/**
 * Helper function to flatten all resources (useful for iteration)
 */
export function flattenNavigationResources(
	navigation: ResourceNavigation | null,
) {
	if (!navigation?.resources) return []

	const flattened = []

	for (const { resource } of navigation.resources) {
		if (resource.type === 'section' && resource.resources) {
			flattened.push(...resource.resources.map((r) => r.resource))
		} else {
			flattened.push(resource)
		}
	}

	return flattened
}
