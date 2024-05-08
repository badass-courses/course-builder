'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { courseBuilderAdapter } from '@/db'

import { ContentResource } from '@coursebuilder/core/types'

export const onArticleSave = async (resource: ContentResource) => {
	const article = await courseBuilderAdapter.getContentResource(resource.id)
	revalidatePath(`/${article?.fields?.slug}`)
	redirect(`/${resource.fields?.slug}`)
}
