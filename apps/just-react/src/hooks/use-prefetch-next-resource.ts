import React from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/trpc/react'
import pluralize from 'pluralize'

import type { ContentResource } from '@coursebuilder/core/schemas'

export function usePrefetchNextResource({
	resource,
	moduleType = 'tutorial',
	moduleSlug,
}: {
	resource: ContentResource
	moduleType?: 'workshop' | 'tutorial'
	moduleSlug?: string
}) {
	const router = useRouter()
	const { data: nextResource } = api.progress.getNextResource.useQuery({
		lessonId: resource.id,
		moduleSlug: moduleSlug,
	})
	const resourceSlug = resource?.fields?.slug
	React.useEffect(() => {
		if (moduleSlug && nextResource) {
			if (nextResource.type === 'solution') {
				router.prefetch(
					`/${pluralize(moduleType)}/${moduleSlug}/${resourceSlug}/solution`,
				)
			} else {
				router.prefetch(
					`/${pluralize(moduleType)}/${moduleSlug}/${nextResource?.fields?.slug}`,
				)
			}
		}
	}, [moduleSlug, moduleType, nextResource, resourceSlug, router])
}
