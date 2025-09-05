'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { ContentResource } from '@coursebuilder/core/schemas'

export const onEventSave = async (resource: ContentResource) => {
	'use server'
	revalidatePath(`/admin/events/${resource.fields?.slug}`)
	// redirect(`/admin/events/${resource.fields?.slug}`)
}
