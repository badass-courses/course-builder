import {z} from 'zod'
import {sanityQuery} from '@/server/sanity.server'

export const ArticleStateSchema = z.union([
  z.literal('draft'),
  z.literal('published'),
  z.literal('archived'),
])

export const ArticleSchema = z.object({
  _id: z.string(),
  _type: z.literal('article'),
  _updatedAt: z.string(),
  title: z.string(),
  description: z.string(),
  body: z.string(),
  slug: z.string(),
  state: ArticleStateSchema.default('draft'),
})

export type Article = z.infer<typeof ArticleSchema>

export async function getArticle(slugOrId: string) {
  return sanityQuery<Article | null>(
    `*[_type == "article" && (_id == "${slugOrId}" || slug.current == "${slugOrId}")][0]{
          _id,
          _type,
          _updatedAt,
          title,
          description,
          body,
          "slug": slug.current,
          state,
  }`,
    {tags: ['articles', slugOrId]},
  )
}
