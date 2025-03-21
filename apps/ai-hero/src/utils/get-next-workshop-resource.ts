import { WorkshopNavigation } from '@/lib/workshops'

/**
 * Flattens all navigation resources, including nested solutions,
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

	// Process all resources and flatten them
	navigation.resources.forEach((resource) => {
		if (resource.type === 'section') {
			// Process section's resources
			resource.resources.forEach((sectionItem) => {
				// Add the section item itself
				flattenedNavResources.push({
					id: sectionItem.id,
					slug: sectionItem.slug,
					title: sectionItem.title,
					type: sectionItem.type,
				})

				// Add solutions if this is a lesson with solutions
				if (
					sectionItem.type === 'lesson' &&
					'resources' in sectionItem &&
					sectionItem.resources?.length > 0
				) {
					sectionItem.resources.forEach((solution) => {
						flattenedNavResources.push({
							id: solution.id,
							slug: sectionItem.slug, // Use parent lesson's slug for solution
							title: solution.title,
							type: solution.type,
							parentId: sectionItem.id,
							parentSlug: sectionItem.slug,
						})
					})
				}
			})
		} else {
			// Add the top-level resource
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
