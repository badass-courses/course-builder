'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { getAbility } from '@/lib/ability'
import { Article, convertToMigratedArticleResource, getArticle } from '@/lib/articles'
import { getServerAuthSession } from '@/server/auth'
import { sanityMutation } from '@/server/sanity.server'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { eq } from 'drizzle-orm'
import { v4 } from 'uuid'
import { z } from 'zod'

export const NewArticleSchema = z.object({
  title: z.string().min(2).max(90),
})

export type NewArticle = z.infer<typeof NewArticleSchema>

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

  const article = await getArticle(newArticleId)

  if (article && session?.user) {
    console.log('inserting article', { article })
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

  const article = await getArticle(input._id)
  if (!article) {
    throw new Error('Article not found')
  }

  const currentArticle = await getArticle(input._id)

  console.log({ currentArticle, input })

  let slugUpdatedTo = input.slug

  if (input.title !== currentArticle?.title) {
    console.log('updating title and slug')
    const splitSlug = currentArticle?.slug.split('~') || ['', guid()]
    const newSlug = `${slugify(input.title)}~${splitSlug[1] || guid()}`
    await sanityMutation([
      {
        patch: {
          id: input._id,
          set: {
            slug: {
              _type: 'slug',
              current: newSlug,
            },
            title: input.title,
          },
        },
      },
    ])
    slugUpdatedTo = newSlug
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
              current: slugUpdatedTo,
            },
          },
        },
      },
    ],
    { returnDocuments: true },
  ).then((res) => res.results[0].document)

  revalidateTag('articles')
  revalidateTag(input._id)

  const updatedArticle = await getArticle(input._id)

  if (updatedArticle) {
    revalidateTag(updatedArticle.slug)
    revalidatePath(`/${updatedArticle.slug}`)
    const dbArticle = convertToMigratedArticleResource({ article: updatedArticle, ownerUserId: user.id })
    await db.update(contentResource).set(dbArticle).where(eq(contentResource.id, updatedArticle._id))
  }

  return updatedArticle
}
