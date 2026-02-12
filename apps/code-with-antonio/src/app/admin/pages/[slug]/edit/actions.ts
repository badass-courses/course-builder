'use server'

import { redirect } from 'next/navigation'
import { serialize } from 'next-mdx-remote/serialize'

import { ContentResource } from '@coursebuilder/core/schemas'

export const onPageSave = async (resource: ContentResource) => {
	'use server'
	redirect(`/admin/coupons`)
}

export async function serializeForPreview(mdxSource: string) {
	try {
		const serializedResult = await serialize(mdxSource, { blockJS: false })
		return serializedResult
	} catch (error) {
		console.error('Error serializing MDX:', error)

		return await serialize('Invalid MDX syntax. Please fix the error.')
	}
}
