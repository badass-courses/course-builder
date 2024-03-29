'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { Article, ArticleSchema, NewArticle } from '@/lib/articles'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { desc, eq, or, sql } from 'drizzle-orm'
import { v4 } from 'uuid'
import { z } from 'zod'

export async function getArticles(): Promise<Article[]> {
	const articles = await db.query.contentResource.findMany({
		where: eq(contentResource.type, 'article'),
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

	revalidateTag('articles')

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

	const query = sql`
    UPDATE ${contentResource}
    SET
      ${contentResource.fields} = JSON_SET(
        ${contentResource.fields},
        '$.title', ${input.fields.title},
        '$.slug', ${articleSlug},
        '$.body', ${input.fields.body},
        '$.state', ${input.fields.state}
      )
    WHERE
      id = ${input.id};
  `

	await db.execute(query).catch((error) => {
		console.error(error)
		throw error
	})

	revalidateTag('articles')
	revalidateTag(input.id)
	revalidateTag(articleSlug)
	revalidatePath(`/${articleSlug}`)

	return await getArticle(input.id)
}

export async function getArticle(slugOrId: string) {
	const article = await db.query.contentResource.findFirst({
		where: or(
			eq(sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`, slugOrId),
			eq(contentResource.id, slugOrId),
		),
	})

	const articleParsed = ArticleSchema.safeParse(article)
	if (!articleParsed.success) {
		console.error('Error parsing article', articleParsed)
		return null
	}

	return articleParsed.data
}
