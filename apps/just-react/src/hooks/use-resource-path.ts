import { useMemo } from 'react'
import { getParentResourceData } from '@/app/(content)/_components/navigation/module-resource-helpers'
import type {
	Level1ResourceWrapper,
	Level2ResourceWrapper,
	ResourceNavigation,
} from '@/lib/content-navigation'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

/**
 * Hook to generate resource paths with parent resolution
 * Memoized to prevent unnecessary re-computations
 */
export function useResourcePath(
	resource: ContentResource,
	parentResource?:
		| Level1ResourceWrapper['resource']
		| Level2ResourceWrapper['resource'],
	resourceNavigation?: ResourceNavigation | null,
) {
	const parentData = useMemo(
		() => getParentResourceData(parentResource, resourceNavigation ?? null),
		[parentResource, resourceNavigation],
	)

	return useMemo(
		() => ({
			viewPath: (slug?: string) =>
				getResourcePath(
					resource.type,
					slug || resource.fields?.slug || '',
					'view',
					parentData,
				),
			editPath: (slug?: string) =>
				getResourcePath(
					resource.type,
					slug || resource.fields?.slug || '',
					'edit',
					parentData,
				),
		}),
		[resource.type, resource.fields?.slug, parentData],
	)
}
