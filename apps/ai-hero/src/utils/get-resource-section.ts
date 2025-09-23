import { Module } from '@/lib/module'
import type { Workshop } from '@/lib/workshops'

import type { ContentResource } from '@coursebuilder/core/schemas'

export async function getResourceSection(
	resourceId: string,
	moduleResource?: Workshop | null,
): Promise<ContentResource | null> {
	if (!moduleResource?.resources) return null
	let sectionData = null

	moduleResource.resources.forEach((section) => {
		if (section?.resource?.type !== 'section') return

		if (section.resourceId === resourceId) {
			sectionData = section.resource
		}

		section.resource.resources.forEach((lesson: { resourceId: string }) => {
			if (lesson.resourceId === resourceId) {
				sectionData = section.resource
			}
		})
	})

	return sectionData
}
