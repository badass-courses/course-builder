import type {
	Level1ResourceWrapper,
	Level2ResourceWrapper,
	ResourceNavigation,
} from '@/lib/content-navigation'

import type { ContentResource } from '@coursebuilder/core/schemas'

/**
 * Flattens all navigation resources, including nested solutions,
 * and returns the next and previous resources relative to the current one.
 */
export function getAdjacentWorkshopResources(
	navigation: ResourceNavigation | null,
	currentResourceId: string,
): {
	nextResource: ContentResource | null
	prevResource: ContentResource | null
	isSolutionNext: boolean
} {
	const defaultReturn = {
		nextResource: null,
		prevResource: null,
		isSolutionNext: false,
	}
	if (!navigation?.resources) {
		return defaultReturn
	}

	// Create a fully flattened array of all resources, including lessons' solutions
	const flattenedNavResources: ContentResource[] = []

	// Helper function to process a resource and its solutions
	const processResource = (
		wrapper: Level1ResourceWrapper | Level2ResourceWrapper,
	) => {
		const resource = wrapper.resource

		// Add the actual resource (not the wrapper)
		// Type assertion needed because wrapper.resource has nested wrapper types
		// but at runtime it's compatible with ContentResource
		flattenedNavResources.push(resource as ContentResource)

		// Add solutions if this is a lesson with solutions
		if (
			resource.type === 'lesson' &&
			resource.resources &&
			resource.resources.length > 0
		) {
			// Find the first solution (lessons should only have one, but handle multiple gracefully)
			const solutionWrapper = resource.resources.find(
				(r) => r.resource?.type === 'solution',
			)

			if (solutionWrapper?.resource) {
				flattenedNavResources.push(solutionWrapper.resource as ContentResource)
			}
		}
	}

	// Process all resources and flatten them
	navigation.resources.forEach((wrapper) => {
		const resource = wrapper.resource
		if (resource.type === 'section') {
			// Process section's resources
			resource.resources?.forEach((sectionItemWrapper) => {
				processResource(sectionItemWrapper)
			})
		} else {
			processResource(wrapper)
		}
	})

	// Find the index of the current resource
	const navIndex = flattenedNavResources.findIndex(
		(resource) => resource.id === currentResourceId,
	)

	if (navIndex === -1) {
		return defaultReturn // Resource not found
	}

	// Get the next and previous resources (if any)
	const nextResource = flattenedNavResources[navIndex + 1] || null
	const prevResource = flattenedNavResources[navIndex - 1] || null

	return {
		nextResource,
		prevResource,
		isSolutionNext: nextResource?.type === 'solution',
	}
}
