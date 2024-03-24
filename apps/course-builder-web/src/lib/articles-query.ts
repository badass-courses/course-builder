'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { Article, ArticleSchema, NewArticle } from '@/lib/articles'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { sql } from 'drizzle-orm'
import { v4 } from 'uuid'
import { z } from 'zod'

export async function getArticles(): Promise<Article[]> {
	const query = sql`
    SELECT
      articles.id as id,
      articles.type as type,
      CAST(articles.updatedAt AS DATETIME) as updatedAt,
      CAST(articles.createdAt AS DATETIME) as createdAt,
      JSON_EXTRACT (articles.fields, "$.title") AS title,
      JSON_EXTRACT (articles.fields, "$.state") AS state,
      JSON_EXTRACT (articles.fields, "$.slug") AS slug
    FROM
      ${contentResource} as articles
    WHERE
      articles.type = 'article'
    ORDER BY articles.createdAt DESC;
  `

	return db
		.execute(query)
		.then((result) => {
			const parsed = z.array(ArticleSchema).safeParse(result.rows)
			return parsed.success ? parsed.data : []
		})
		.catch((error) => {
			console.error(error)
			throw error
		})
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
			title: input.title,
			state: 'draft',
			visibility: 'unlisted',
			slug: slugify(`${input.title}~${guid()}`),
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

	let articleSlug = input.slug

	if (input.title !== currentArticle?.title) {
		const splitSlug = currentArticle?.slug.split('~') || ['', guid()]
		articleSlug = `${slugify(input.title)}~${splitSlug[1] || guid()}`
	}

	const query = sql`
    UPDATE ${contentResource}
    SET
      ${contentResource.fields} = JSON_SET(
        ${contentResource.fields},
        '$.title', ${input.title},
        '$.slug', ${articleSlug},
        '$.body', ${input.body},
        '$.state', ${input.state}
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
	const query = sql`
    SELECT
      articles.id as id,
      articles.type as type,
      CAST(articles.updatedAt AS DATETIME) as updatedAt,
      CAST(articles.createdAt AS DATETIME) as createdAt,
      JSON_EXTRACT (articles.fields, "$.title") AS title,
      JSON_EXTRACT (articles.fields, "$.state") AS state,
      JSON_EXTRACT (articles.fields, "$.body") AS body,
      JSON_EXTRACT (articles.fields, "$.slug") AS slug
    FROM
      ${contentResource} as articles
    WHERE
      articles.type = 'article' AND (articles.id = ${slugOrId} OR JSON_EXTRACT (articles.fields, "$.slug") = ${slugOrId});
  `

	return db
		.execute(query)
		.then((result) => {
			const parsed = ArticleSchema.safeParse(result.rows[0])

			if (!parsed.success) {
				console.error('Error parsing article', slugOrId)
				console.error(parsed.error)
				return null
			} else {
				return parsed.data
			}
		})
		.catch((error) => {
			console.error(error)
			return error
		})
}
