import type { ContentResourceResource } from '@coursebuilder/core/dist/schemas/content-resource-schema'

/**
 * Filters resources based on their types, removing specified types from the resource tree.
 * This function recursively processes nested resources and updates position indices.
 *
 * @param resources - Array of resources to filter
 * @param removeTypes - Types to remove, can be a string (single type) or array of strings (multiple types)
 * @returns Filtered array of resources with updated positions
 *
 * @example
 * ```ts
 * // Remove video resources from a tutorial
 * const filteredResources = filterResources(tutorial.resources, 'videoResource')
 *
 * // Remove both video and link resources
 * const filteredResources = filterResources(tutorial.resources, ['videoResource', 'linkResource'])
 * ```
 */
export function filterResources(
	resources: ContentResourceResource[] | undefined | null,
	removeTypes: string[] | string = 'videoResource',
): ContentResourceResource[] {
	if (!resources || !resources.length) {
		return []
	}

	return resources.reduce(
		(
			filteredResources: ContentResourceResource[],
			resource: ContentResourceResource,
		) => {
			// Skip resources with types that should be removed
			if (
				removeTypes.length > 0
					? !removeTypes.includes(resource.resource.type)
					: removeTypes !== resource.resource.type
			) {
				// Recursively filter nested resources if they exist
				if (resource.resource.resources) {
					resource.resource.resources = filterResources(
						resource.resource.resources,
						removeTypes,
					)
				}

				// Add the filtered resource to our results
				filteredResources.push({
					...resource,
					resource: {
						...resource.resource,
						resources: resource.resource.resources || [],
					},
				})
			}

			// Update positions to ensure they remain sequential
			return filteredResources.map((r: ContentResourceResource, i: number) => {
				return {
					...r,
					position: i,
				}
			})
		},
		[],
	)
}
