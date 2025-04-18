'use server'

import { redirect } from 'next/navigation'

import { ContentResource } from '@coursebuilder/core/schemas'

export const onEmailSave = async (resource: ContentResource) => {
	'use server'
	redirect(`/admin/emails`)
}
