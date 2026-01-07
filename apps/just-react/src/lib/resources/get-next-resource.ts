'use server'

import { flattenNavigationResources } from '@/lib/content-navigation'
import { getCachedLesson } from '@/lib/lessons-query'
import { getCachedWorkshopNavigation } from '@/lib/workshops-query'

export async function getNextResource(
	currentResourceId: string,
	moduleSlugOrId: string,
) {
	const navigation = await getCachedWorkshopNavigation(moduleSlugOrId)

	const flattenedNavResources = flattenNavigationResources(navigation) || []

	const navIndex =
		flattenedNavResources?.findIndex(
			(resource) => resource.id === currentResourceId,
		) || -1

	if (!navIndex || navIndex === -1) {
		throw new Error('Current resource not found')
	}

	const nextResourceId = flattenedNavResources[navIndex + 1]?.id
	return nextResourceId ? getCachedLesson(nextResourceId) : null
}
