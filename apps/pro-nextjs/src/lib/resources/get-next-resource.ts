'use server'

import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { and, asc, eq, gt, not, or, sql } from 'drizzle-orm'

import type {
	ContentResource,
	ContentResourceResource,
} from '@coursebuilder/core/types'

const ALLOWED_MODULE_RESOURCE_TYPES = ['lesson', 'exercise', 'solution']

function flattenResources(
	resources: ContentResourceResource[],
): ContentResource[] {
	const result: ContentResource[] = []

	function recurse(resources: ContentResourceResource[]) {
		for (const nestedResource of resources) {
			const resource = nestedResource.resource
			result.push(resource)
			if (resource.resources) {
				recurse(resource.resources)
			}
		}
	}

	recurse(resources)
	return result
}

export async function getNextResource(
	currentResourceId: string,
	moduleSlugOrId: string,
) {
	const module = await db.query.contentResource.findFirst({
		where: or(
			eq(
				sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
				moduleSlugOrId,
			),
			eq(contentResource.id, moduleSlugOrId),
		),
		with: {
			resources: {
				with: {
					resource: {
						with: {
							resources: {
								with: {
									resource: {
										with: {
											resources: {
												with: {
													resource: true,
												},
											},
										},
									},
								},
								orderBy: asc(contentResourceResource.position),
							},
						},
					},
				},
				orderBy: asc(contentResourceResource.position),
			},
		},
	})

	if (!module) {
		throw new Error('Module not found')
	}

	const allResources = module?.resources && flattenResources(module.resources)

	if (!allResources) {
		throw new Error('No resources found')
	}

	const filteredResources = allResources?.filter((resource) => {
		return ALLOWED_MODULE_RESOURCE_TYPES.includes(resource.type)
	})

	if (!filteredResources) {
		throw new Error('No allowed resources found')
	}

	const currentIndex = filteredResources?.findIndex(
		(resource) => resource.id === currentResourceId,
	)

	if (currentIndex === -1) {
		throw new Error('Current resource not found')
	}

	const nextResource =
		(filteredResources !== undefined &&
			currentIndex !== undefined &&
			filteredResources[currentIndex + 1]) ||
		null

	return nextResource
}
