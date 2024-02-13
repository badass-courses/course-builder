import { sanityQuery } from '@/server/sanity.server'

export async function getResource<T = any>(slugOrId: string): Promise<T | null> {
  return sanityQuery<T | null>(`*[(_id == "${slugOrId}" || slug.current == "${slugOrId}")][0]{
          _id,
          _type,
          "_updatedAt": ^._updatedAt,
          title,
          summary,
          body,
          "slug": slug.current,
          transcript
  }`)
}
