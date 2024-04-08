'use server'

import { courseBuilderAdapter } from '@/db'
import { Article } from '@/lib/articles'
import { createArticle, getArticle } from '@/lib/articles-query'
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

	const currentArticle = await getArticle(input.id)

	if (!currentArticle) {
		return courseBuilderAdapter.createContentResource(input)
	}

	let resourceSlug = input.fields.slug

	if (input.fields.title !== currentArticle?.fields.title) {
		const splitSlug = currentArticle?.fields.slug.split('~') || ['', guid()]
		resourceSlug = `${slugify(input.fields.title)}~${splitSlug[1] || guid()}`
	}

	return courseBuilderAdapter.updateContentResourceFields({
		id: currentArticle.id,
		fields: {
			...currentArticle.fields,
			...input.fields,
			slug: resourceSlug,
		},
	})
}
