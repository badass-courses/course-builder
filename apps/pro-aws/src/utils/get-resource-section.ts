import type { ContentResource } from '@coursebuilder/core/types'

export async function getResourceSection(
	resourceId: string,
	moduleResource?: ContentResource | null,
): Promise<ContentResource | null> {
	if (!moduleResource?.resources) return null
	let sectionData = null

	moduleResource.resources.forEach((section) => {
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
