import type {
	Level1ResourceWrapper,
	Level2ResourceWrapper,
	NestedContentResource,
} from '@/lib/content-navigation'

import type { ContentResourceResource } from '@coursebuilder/core/schemas'

/**
 * Flattens all navigation resources, including nested solutions,
 * and returns the next and previous resources relative to the current one.
 */
export function getAdjacentWorkshopResources(
	navigation: NestedContentResource | null,
	currentResourceId: string,
): {
	nextResource: ContentResourceResource | null
	prevResource: ContentResourceResource | null
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
	const flattenedNavResources: ContentResourceResource[] = []

	// Helper function to process a resource and its solutions
	const processResource = (
		wrapper: Level1ResourceWrapper | Level2ResourceWrapper,
	) => {
		const resource = wrapper.resource

		// Add the wrapper itself
		flattenedNavResources.push(wrapper)

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

			if (solutionWrapper) {
				flattenedNavResources.push(solutionWrapper)
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
		(wrapper) => wrapper.resourceId === currentResourceId,
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
		isSolutionNext: nextResource?.resource?.type === 'solution',
	}
}
