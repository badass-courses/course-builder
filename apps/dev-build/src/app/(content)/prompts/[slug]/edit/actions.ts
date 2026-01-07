'use server'

import { redirect } from 'next/navigation'

import { ContentResource } from '@coursebuilder/core/schemas'

export const onPromptSave = async (resource: ContentResource) => {
	'use server'
	redirect(`/prompts/${resource.fields?.slug}`)
}
