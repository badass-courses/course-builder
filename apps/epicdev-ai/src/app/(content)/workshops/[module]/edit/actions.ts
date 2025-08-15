'use server'

import { redirect } from 'next/navigation'

import { ContentResource } from '@coursebuilder/core/schemas'

export const onWorkshopSave = async (resource: ContentResource) => {
	'use server'
	redirect(`/workshops/${resource.fields?.slug}`)
}
