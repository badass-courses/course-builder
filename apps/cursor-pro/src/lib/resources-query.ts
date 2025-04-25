'use server'

import { courseBuilderAdapter } from '@/db'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'

export async function updateResource(input: {
	id: string
	type: string
	fields: Record<string, any>
	createdById: string
}) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user || !ability.can('update', 'Content')) {
		throw new Error('Unauthorized')
	}

	const currentResource = await courseBuilderAdapter.getContentResource(
		input.id,
	)

	if (!currentResource) {
		return courseBuilderAdapter.createContentResource(input)
	}

	let resourceSlug = input.fields.slug

	if (input.fields.title !== currentResource?.fields?.title) {
		const splitSlug = currentResource?.fields?.slug.split('~') || ['', guid()]
		resourceSlug = `${slugify(input.fields.title)}~${splitSlug[1] || guid()}`
	}

	return courseBuilderAdapter.updateContentResourceFields({
		id: currentResource.id,
		fields: {
			...currentResource.fields,
			...input.fields,
			slug: resourceSlug,
			...(input.fields.image && {
				image: input.fields.image,
			}),
		},
	})
}
