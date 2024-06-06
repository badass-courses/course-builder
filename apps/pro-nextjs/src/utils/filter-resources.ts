import type {
	ContentResource,
	ContentResourceResource,
} from '@coursebuilder/core/schemas/content-resource-schema'

export function filterResources(
	resources: ContentResourceResource[],
	removeType: string = 'videoResource',
) {
	return resources.reduce(
		(
			filteredResources: ContentResourceResource[],
			resource: ContentResourceResource,
		) => {
			if (resource.resource.type !== removeType) {
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
