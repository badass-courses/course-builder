'use server'

import { revalidatePath } from 'next/cache'

import { ContentResource } from '@coursebuilder/core/schemas'

export const onCohortSave = async (resource: ContentResource) => {
	'use server'
	revalidatePath(`/cohorts/${resource.fields?.slug}`)
}
