import {z} from 'zod'
import {sanityQuery} from '@/server/sanity.server'

export const ArticleSchema = z.object({
  _id: z.string(),
  _type: z.literal('article'),
  _updatedAt: z.string(),
  title: z.string(),
  summary: z.string(),
  body: z.string(),
  slug: z.string(),
})

export type Article = z.infer<typeof ArticleSchema>

export async function getArticle(slugOrId: string) {
  return sanityQuery<Article | null>(
    `*[_type == "article" && (_id == "${slugOrId}" || slug.current == "${slugOrId}")][0]{
          _id,
          _type,
          "_updatedAt": ^._updatedAt,
          title,
          summary,
          body,
          "slug": slug.current,
  }`,
    {tags: ['articles', slugOrId]},
  )
}
