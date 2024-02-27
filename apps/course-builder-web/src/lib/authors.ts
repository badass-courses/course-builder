import { sanityQuery } from '@/server/sanity.server'
import { z } from 'zod'

export const AuthorSchema = z.object({
  _id: z.string(),
  _type: z.literal('author'),
  _updatedAt: z.string(),
  name: z.string().min(2).max(90),
  picture: z.object({
    url: z.string().optional().nullable(),
    alt: z.string().optional().nullable(),
  }),
})

export type Author = z.infer<typeof AuthorSchema>
export const AuthorsSchema = z.array(AuthorSchema)

export const getAuthors = async () => {
  const data = await sanityQuery<Author[]>(
    `*[_type == "author"]{
          _id,
          _type,
          _updatedAt,
          name,
          "picture": picture.asset->{url, alt},
      }`,
    { tags: ['authors'] },
  ).catch((error) => {
    console.error('Error fetching authors', error)
    return []
  })

  const authors = AuthorsSchema.parse(data)

  return authors
}
