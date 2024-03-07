'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { getAbility } from '@/lib/ability'
import { Article, ArticleSchema, convertToMigratedArticleResource, NewArticle } from '@/lib/articles'
import { VideoResourceSchema } from '@/lib/video-resource'
import { getServerAuthSession } from '@/server/auth'
import { sanityMutation, sanityQuery } from '@/server/sanity.server'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { eq, sql } from 'drizzle-orm'
import { v4 } from 'uuid'

async function getSanityArticle(slugOrId: string): Promise<Article | null> {
  return sanityQuery<Article | null>(
    `*[_id == "${slugOrId}"][0]{
      ...,
      "slug": slug.current,
    }`,
    { tags: ['articles', slugOrId] },
  )
}

export async function createArticle(input: NewArticle) {
  const session = await getServerAuthSession()
  const user = session?.user
  const ability = getAbility({ user })
  if (!user || !ability.can('create', 'Content')) {
    throw new Error('Unauthorized')
  }

  const newArticleId = v4()

  await sanityMutation([
    {
      createOrReplace: {
        _id: newArticleId,
        _type: 'article',
        state: 'draft',
        visibility: 'unlisted',
        title: input.title,
        slug: {
          current: slugify(`${input.title}~${guid()}`),
        },
      },
    },
  ])

  const article = await getSanityArticle(newArticleId)

  if (article && session?.user) {
    await db.insert(contentResource).values(convertToMigratedArticleResource({ article, ownerUserId: session.user.id }))
  }

  revalidateTag('articles')

  return article
}

export async function updateArticle(input: Article) {
  const session = await getServerAuthSession()
  const user = session?.user
  const ability = getAbility({ user })
  if (!user || !ability.can('update', 'Content')) {
    throw new Error('Unauthorized')
  }

  console.log('Updating Article', { input })

  const currentArticle = await getSanityArticle(input._id)

  if (!currentArticle) {
    return createArticle(input)
  }

  let articleSlug = input.slug

  if (input.title !== currentArticle?.title) {
    const splitSlug = currentArticle?.slug.split('~') || ['', guid()]
    articleSlug = `${slugify(input.title)}~${splitSlug[1] || guid()}`
  }

  await sanityMutation(
    [
      {
        patch: {
          id: input._id,
          set: {
            ...input,
            slug: {
              _type: 'slug',
              current: articleSlug,
            },
          },
        },
      },
    ],
    { returnDocuments: true },
  ).then((res) => res.results[0].document)

  revalidateTag('articles')
  revalidateTag(input._id)
  revalidateTag(articleSlug)
  revalidatePath(`/${articleSlug}`)

  const updatedArticle = await getSanityArticle(input._id)

  if (updatedArticle) {
    const dbArticle = convertToMigratedArticleResource({ article: updatedArticle, ownerUserId: user.id })
    await db.update(contentResource).set(dbArticle).where(eq(contentResource.id, updatedArticle._id))
    console.log('Updated Article', { updatedArticle })
    return updatedArticle
  } else {
    throw new Error('Article not found')
  }
}

export async function getArticle(slugOrId: string) {
  const query = sql`
    SELECT
      articles.id as _id,
      articles.type as _type,
      CAST(articles.updatedAt AS DATETIME) as _updatedAt,
      CAST(articles.createdAt AS DATETIME) as _createdAt,
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
