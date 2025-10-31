import { z } from 'zod'

import {
	ContentResourceResourceSchema,
	ContentResourceSchema,
	productSchema,
	type ContentResource,
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
	return null
}

const resolveFirstSlug = (resource: ContentResource): string | null => {
	if (resource.type === 'section' && resource.resources) {
		for (const child of resource.resources) {
			const slug = resolveFirstSlug(child.resource)
			if (slug) return slug
		}

		return null
	}

	return resource.fields?.slug || null
}

/**
 * Helper function to get the first resource slug
 */
export function getFirstResourceSlug(
	navigation: ResourceNavigation | null,
): string | null {
	if (!navigation?.resources) return null

	for (const resourceWrapper of navigation.resources ?? []) {
		const resource = ContentResourceSchema.parse(resourceWrapper.resource)
		const slug = resolveFirstSlug(resource)
		if (slug) return slug
	}

	return null
}

/**
 * Helper function to flatten all resources (useful for iteration)
 */
export function flattenNavigationResources(
	navigation: ResourceNavigation | null,
) {
	if (!navigation?.resources) return []

	const flattened: ContentResource[] = []

	for (const { resource } of navigation.resources) {
		if (resource.type === 'section' && resource.resources) {
			flattened.push(
				...resource.resources.map((r) =>
					ContentResourceSchema.parse(r.resource),
				),
			)
		} else {
			flattened.push(ContentResourceSchema.parse(resource))
		}
	}

	return flattened
}

/**
 * Helper function to find the parent lesson for a solution resource
 */
export function findParentLessonForSolution(
	navigation: ResourceNavigation | null,
	solutionResourceId: string,
): ContentResource | null {
	if (!navigation?.resources) return null

	// Iterate through sections to find lessons
	for (const level1Wrapper of navigation.resources) {
		const level1Resource = level1Wrapper.resource

		// If it's a section, iterate through its resources (lessons)
		if (level1Resource.type === 'section' && level1Resource.resources) {
			for (const level2Wrapper of level1Resource.resources) {
				const level2Resource = level2Wrapper.resource
				// Check if this lesson contains the solution
				if (level2Resource.type === 'lesson' && level2Resource.resources) {
					const solutionResource = level2Resource.resources.find(
						(level3Wrapper) =>
							level3Wrapper.resource.id === solutionResourceId &&
							level3Wrapper.resource.type === 'solution',
					)
					if (solutionResource) {
						return ContentResourceSchema.parse(level2Resource)
					}
				}
			}
		} else if (level1Resource.type === 'lesson' && level1Resource.resources) {
			// Top-level lesson (no section)
			const solutionResource = level1Resource.resources.find(
				(level2Wrapper) =>
					level2Wrapper.resource.id === solutionResourceId &&
					level2Wrapper.resource.type === 'solution',
			)
			if (solutionResource) {
				return ContentResourceSchema.parse(level1Resource)
			}
		}
	}
	return null
}
