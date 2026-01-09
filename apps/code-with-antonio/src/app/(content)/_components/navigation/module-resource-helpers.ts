import type {
	Level1ResourceWrapper,
	Level2ResourceWrapper,
	ResourceNavigation,
} from '@/lib/content-navigation'

import type {
	ContentResource,
	ModuleProgress,
} from '@coursebuilder/core/schemas'

/**
 * Data attribute constants for module resource list components
 * Used for consistent naming and accessibility checks
 */
export const MODULE_RESOURCE_LIST_DATA_ATTRS = {
	header: 'module-resource-list-header',
	content: 'module-resource-list-content',
	section: 'module-resource-list-section',
	lesson: 'module-resource-list-lesson',
	solutionMenu: 'module-resource-list-solution-menu',
} as const

/**
 * Extract child resources from a resource
 */
export function getChildResources(
	resource: ContentResource,
): ContentResource[] {
	return resource.resources?.map((r) => r.resource).filter(Boolean) || []
}

/**
 * Check if a section is completed (all child lessons are completed)
 */
export function isSectionCompleted(
	resource: ContentResource,
	moduleProgress: ModuleProgress | null | undefined,
): boolean {
	if (resource.type !== 'section') return false

	const childResources = getChildResources(resource)
	return childResources.every((item) =>
		moduleProgress?.completedLessons?.some(
			(progress) => progress.resourceId === item.id && progress.completedAt,
		),
	)
}

/**
 * Check if a lesson is completed
 */
export function isLessonCompleted(
	lessonId: string,
	moduleProgress: ModuleProgress | null | undefined,
): boolean {
	return (
		moduleProgress?.completedLessons?.some(
			(progress) => progress.resourceId === lessonId && progress.completedAt,
		) ?? false
	)
}

/**
 * Extract parent context from module navigation for breadcrumb display.
 * Currently extracts cohort parent data when present.
 */
export function getParentContext(moduleNavigation: ResourceNavigation | null) {
	if (!moduleNavigation) return null

	const cohortProduct =
		moduleNavigation?.parents?.[0]?.type === 'cohort' &&
		moduleNavigation?.parents?.[0]

	if (!cohortProduct) return null

	const cohortResource = cohortProduct?.resources?.[0]?.resource
	return {
		slug: cohortResource?.fields?.slug ?? null,
		title: cohortResource?.fields?.title ?? null,
	}
}

/**
 * Resolve parent resource data for URL generation
 * Prioritizes parentResource over resourceNavigation
 */
export function getParentResourceData(
	parentResource:
		| Level1ResourceWrapper['resource']
		| Level2ResourceWrapper['resource']
		| undefined,
	resourceNavigation: ResourceNavigation | null,
): { parentSlug: string; parentType: string } | undefined {
	if (parentResource) {
		return {
			parentSlug: parentResource.fields?.slug ?? '',
			parentType: parentResource.type,
		}
	}

	if (resourceNavigation) {
		return {
			parentSlug: resourceNavigation.fields?.slug ?? '',
			parentType: resourceNavigation.type,
		}
	}

	return undefined
}
