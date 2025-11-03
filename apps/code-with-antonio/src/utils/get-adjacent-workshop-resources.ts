import type { ResourceNavigation } from '@/lib/content-navigation'
import { flattenNavigationResources } from '@/lib/content-navigation'

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

	// Use the shared flattenNavigationResources helper
	const flattenedNavResources = flattenNavigationResources(navigation)

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
