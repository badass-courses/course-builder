'use server'

import { redirect } from 'next/navigation'

import { ContentResource } from '@coursebuilder/core/types'

export const onWorkshopSave = async (resourceSlug: string) => {
	'use server'
	redirect(`/workshops/${resourceSlug}`)
}
