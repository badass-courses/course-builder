'use server'

import { revalidateTag } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import { contentResource } from '@/db/schema'
import { Article, ArticleSchema, NewArticle } from '@/lib/articles'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { and, desc, eq, inArray, or, sql } from 'drizzle-orm'
import { v4 } from 'uuid'
import { z } from 'zod'

export async function getArticles(): Promise<Article[]> {
	const { ability } = await getServerAuthSession()

	const visibility: ('public' | 'private' | 'unlisted')[] = ability.can(
		'update',
		'Content',
	)
		? ['public', 'private', 'unlisted']
		: ['public']
	const states: ('draft' | 'published')[] = ability.can('update', 'Content')
		? ['draft', 'published']
		: ['published']

	const articles = await db.query.contentResource.findMany({
		where: and(
			eq(contentResource.type, 'article'),
			inArray(
				sql`JSON_EXTRACT (${contentResource.fields}, "$.visibility")`,
				visibility,
			),
			inArray(sql`JSON_EXTRACT (${contentResource.fields}, "$.state")`, states),
		),
		orderBy: desc(contentResource.createdAt),
	})

	const articlesParsed = z.array(ArticleSchema).safeParse(articles)
	if (!articlesParsed.success) {
		console.error('Error parsing articles', articlesParsed)
		return []
	}

	return articlesParsed.data
}

export async function createArticle(input: NewArticle) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const newArticleId = v4()

	await db.insert(contentResource).values({
		id: newArticleId,
		type: 'article',
		fields: {
			title: input.fields.title,
			state: 'draft',
			visibility: 'unlisted',
			slug: slugify(`${input.fields.title}~${guid()}`),
		},
		createdById: user.id,
	})

	const article = await getArticle(newArticleId)

	revalidateTag('articles', 'max')

	return article
}

export async function updateArticle(input: Article) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('update', 'Content')) {
		throw new Error('Unauthorized')
	}

	const currentArticle = await getArticle(input.id)

	if (!currentArticle) {
		return createArticle(input)
	}

	let articleSlug = input.fields.slug

	if (input.fields.title !== currentArticle?.fields.title) {
		const splitSlug = currentArticle?.fields.slug.split('~') || ['', guid()]
		articleSlug = `${slugify(input.fields.title)}~${splitSlug[1] || guid()}`
	}

	return courseBuilderAdapter.updateContentResourceFields({
		id: currentArticle.id,
		fields: {
			...currentArticle.fields,
			...input.fields,
			slug: articleSlug,
		},
	})
}

export async function getArticle(slugOrId: string) {
	console.log('getArticle', { slugOrId })
	// const { ability } = await getServerAuthSession()

	// const visibility: ('public' | 'private' | 'unlisted')[] = ability.can(
	// 	'update',
	// 	'Content',
	// )
	// 	? ['public', 'private', 'unlisted']
	// 	: ['public']
	// const states: ('draft' | 'published')[] = ability.can('update', 'Content')
	// 	? ['draft', 'published']
	// 	: ['published']

	const article = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`, slugOrId),
				eq(contentResource.id, slugOrId),
			),
		),
	})

	console.log('article', article)

	const articleParsed = ArticleSchema.safeParse(article)
	if (!articleParsed.success) {
		console.error('Error parsing article', articleParsed)
		return null
	}

	return articleParsed.data
}
