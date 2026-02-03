'use server'

import { redirect } from 'next/navigation'

import { ContentResource } from '@coursebuilder/core/schemas'

export const onLessonSave = async (
	modulePath: string,
	resource: ContentResource,
) => {
	'use server'
	redirect(`${modulePath}/${resource.fields?.slug}`)
}
