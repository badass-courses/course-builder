import type { ContentResourceResource } from '@coursebuilder/core/schemas/content-resource-schema'

export function filterResources(
	resources: ContentResourceResource[],
	removeTypes: string[] | string = 'videoResource',
) {
	return resources.reduce(
		(
			filteredResources: ContentResourceResource[],
			resource: ContentResourceResource,
		) => {
			if (
				removeTypes.length > 0
					? !removeTypes.includes(resource.resource.type)
					: removeTypes !== resource.resource.type
			) {
				if (resource.resource.resources) {
					resource.resource.resources = filterResources(
						resource.resource.resources,
					)
				}
				filteredResources.push({
					...resource,
					resource: {
						...resource.resource,
						resources: resource.resource.resources || [],
					},
				})
			}
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
