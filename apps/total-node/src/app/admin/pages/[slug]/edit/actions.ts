'use server'

import { redirect } from 'next/navigation'

import { ContentResource } from '@coursebuilder/core/schemas'

export const onPageSave = async (resource: ContentResource) => {
	'use server'
	redirect(`/admin/pages`)
}
