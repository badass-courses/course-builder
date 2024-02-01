import { sanityQuery } from '@/server/sanity.server'
import { z } from 'zod'

export const ArticleStateSchema = z.union([
  z.literal('draft'),
  z.literal('published'),
  z.literal('archived'),
  z.literal('deleted'),
])

export const ArticleVisibilitySchema = z.union([z.literal('public'), z.literal('private'), z.literal('unlisted')])

export const ArticleSchema = z.object({
  _id: z.string(),
  _type: z.literal('article'),
  _updatedAt: z.string(),
  title: z.string().min(2).max(90),
  body: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  slug: z.string(),
  state: ArticleStateSchema.default('draft'),
  visibility: ArticleVisibilitySchema.default('unlisted'),
  socialImage: z.string().optional().nullable(),
})

export type Article = z.infer<typeof ArticleSchema>

export async function getArticle(slugOrId: string) {
  const article = await sanityQuery<Article | null>(
    `*[_type == "article" && (_id == "${slugOrId}" || slug.current == "${slugOrId}")][0]{
          _id,
          _type,
          _updatedAt,
          title,
          description,
          body,
          visibility,
          "slug": slug.current,
          state,
          socialImage,
  }`,
    { tags: ['articles', slugOrId] },
  )

  const parsed = ArticleSchema.safeParse(article)

  if (!parsed.success) {
    console.error('Error parsing article', slugOrId)
    console.error(parsed.error)
    return null
  } else {
    return parsed.data
  }
}
