import {
	WorkshopNavigation,
	type NavigationResource,
	type NavigationSection,
} from '@/lib/workshops'

/**
 * Flattens all navigation resources, including nested solutions and nested sections,
 * and returns the next resource after the current one
 */
export function getNextWorkshopResource(
	navigation: WorkshopNavigation | null,
	currentResourceId: string,
): {
	id: string
	slug: string
	title: string
	type: string
	parentId?: string
	parentSlug?: string
} | null {
	if (!navigation) {
		return null
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

	/**
	 * Helper function to process a lesson/post resource and its solutions
	 */
	const processResource = (resource: NavigationResource) => {
		if (resource.type === 'section') {
			// Recursively process section contents
			processSection(resource)
			return
		}

		// Add the resource itself (lesson/post)
		flattenedNavResources.push({
			id: resource.id,
			slug: resource.slug,
			title: resource.title,
			type: resource.type,
		})

		// Add solutions (exercises are just URL states, not separate resources)
		if (
			resource.type === 'lesson' &&
			'resources' in resource &&
			resource.resources?.length > 0
		) {
			resource.resources.forEach((childResource) => {
				// Only add actual solution resources
				if (childResource.type === 'solution') {
					flattenedNavResources.push({
						id: childResource.id,
						slug: childResource.slug || resource.slug,
						title: childResource.title || resource.title,
						type: childResource.type,
						parentId: resource.id,
						parentSlug: resource.slug,
					})
				}
			})
		}
	}

	/**
	 * Recursively processes a section, handling nested sub-sections
	 */
	const processSection = (section: NavigationSection) => {
		section.resources.forEach((item) => {
			processResource(item)
		})
	}

	// Process all top-level resources and flatten them
	navigation.resources.forEach((resource) => {
		processResource(resource)
	})

	// Find the index of the current resource
	const navIndex = flattenedNavResources.findIndex(
		(resource) => resource.id === currentResourceId,
	)

	if (navIndex === -1) {
		return null // Resource not found
	}

	// Get the next resource (if any)
	return flattenedNavResources[navIndex + 1] || null
}
