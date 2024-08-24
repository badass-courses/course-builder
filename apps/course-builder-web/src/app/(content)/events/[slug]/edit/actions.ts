'use server'

import { redirect } from 'next/navigation'

import { ContentResource } from '@coursebuilder/core/schemas'

export const onEventSave = async (resource: ContentResource) => {
	'use server'
	redirect(`/events/${resource.fields?.slug}`)
}
