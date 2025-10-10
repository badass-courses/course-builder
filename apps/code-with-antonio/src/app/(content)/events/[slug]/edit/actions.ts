'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { ContentResource } from '@coursebuilder/core/schemas'

export const onEventSave = async (resource: ContentResource) => {
	'use server'
	revalidatePath(`/events/${resource.fields?.slug}`)
	redirect(`/events/${resource.fields?.slug}`)
}
