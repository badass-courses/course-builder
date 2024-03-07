import { sanityQuery } from '@/server/sanity.server'
import { guid } from '@/utils/guid'
import { z } from 'zod'

export const NewArticleSchema = z.object({
  title: z.string().min(2).max(90),
})
export type NewArticle = z.infer<typeof NewArticleSchema>

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
  _createdAt: z.string(),
  title: z.string().min(2).max(90),
  body: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  slug: z.string(),
  state: ArticleStateSchema.default('draft'),
  visibility: ArticleVisibilitySchema.default('unlisted'),
  socialImage: z.string().optional().nullable(),
})

export type Article = z.infer<typeof ArticleSchema>

export const MigratedArticleResourceSchema = z.object({
  createdById: z.string(),
  type: z.string(),
  id: z.string(),
  updatedAt: z.date(),
  createdAt: z.date(),
  fields: z
    .object({
      slug: z.string(),
      title: z.string().nullable(),
      body: z.string().nullable().optional(),
      state: z.string(),
      visibility: z.string(),
      description: z.string().optional().nullable(),
      socialImage: z.object({ type: z.string(), url: z.string() }).optional().nullable(),
    })
    .default({
      title: 'New Article',
      slug: `article-${guid()}`,
      state: 'draft',
      visibility: 'unlisted',
      description: null,
      socialImage: null,
    }),
})

export function convertToMigratedArticleResource({ article, ownerUserId }: { article: Article; ownerUserId: string }) {
  return MigratedArticleResourceSchema.parse({
    createdById: ownerUserId,
    type: 'article',
    createdAt: new Date(article._createdAt || new Date().toISOString()),
    updatedAt: new Date(article._updatedAt || new Date().toISOString()),
    id: article._id,
    fields: {
      slug: article.slug,
      title: article.title,
      body: article.body,
      state: article.state,
      visibility: article.visibility,
      ...(article.description ? { description: article.description } : null),
      ...(article.socialImage
        ? {
            socialImage: {
              type: 'imageUrl',
              url: article.socialImage,
            },
          }
        : null),
    },
  })
}
