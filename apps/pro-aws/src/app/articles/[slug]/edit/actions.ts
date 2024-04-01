'use server'

import { redirect } from 'next/navigation'

import { ContentResource } from '@coursebuilder/core/types'

export const onArticleSave = async (resource: ContentResource) => {
	'use server'
	redirect(`/${resource.fields?.slug}`)
}
