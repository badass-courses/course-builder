'use server'

import { redirect } from 'next/navigation'

import { ContentResource } from '@coursebuilder/core/types'

export const onTutorialSave = async (resource: ContentResource) => {
	'use server'
	redirect(`/tutorials/${resource.fields?.slug}`)
}
