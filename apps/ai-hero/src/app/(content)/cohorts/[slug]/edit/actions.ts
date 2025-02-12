'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { ContentResource } from '@coursebuilder/core/schemas'

export const onCohortSave = async (resource: ContentResource) => {
	'use server'
	revalidatePath(`/cohorts/${resource.fields?.slug}`)
	redirect(`/cohorts/${resource.fields?.slug}`)
}
