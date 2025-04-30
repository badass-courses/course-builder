import { WorkshopNavigation, type NavigationResource } from '@/lib/workshops'

export type AdjacentResource = {
	id: string
	slug: string
	title: string
	type: string
	parentId?: string
	parentSlug?: string
} | null

/**
 * Flattens all navigation resources, including nested solutions,
 * and returns the next and previous resources relative to the current one.
 */
export function getAdjacentWorkshopResources(
	navigation: WorkshopNavigation | null,
	currentResourceId: string,
): {
	nextResource: AdjacentResource
	prevResource: AdjacentResource
} {
	const defaultReturn = { nextResource: null, prevResource: null }
	if (!navigation) {
		return defaultReturn
	}

	// Create a fully flattened array of all resources, including lessons' solutions
	const flattenedNavResources: Array<{
		id: string
		slug: string
		title: string
		type: string
		parentId?: string
		parentSlug?: string
	}> = []

	// Helper function to process a resource and its solutions
	const processResource = (
		resource: NavigationResource,
		isInSection = false,
	) => {
		// Add the resource itself
		flattenedNavResources.push({
			id: resource.id,
			slug: resource.slug,
			title: resource.title,
			type: resource.type,
		})

		// Add solutions if this is a lesson with solutions
		if (
			resource.type === 'lesson' &&
			'resources' in resource &&
			resource.resources?.length > 0
		) {
			resource.resources.forEach((solution) => {
				flattenedNavResources.push({
					id: solution.id,
					slug: resource.slug, // Use parent lesson's slug for solution
					title: solution.title,
					type: solution.type,
					parentId: resource.id,
					parentSlug: resource.slug,
				})
			})
		}
	}

	// Process all resources and flatten them
	navigation.resources.forEach((resource) => {
		if (resource.type === 'section') {
			// Process section's resources
			resource.resources.forEach((sectionItem) => {
				processResource(sectionItem, true)
			})
		} else {
			processResource(resource)
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

	return { nextResource, prevResource }
}
