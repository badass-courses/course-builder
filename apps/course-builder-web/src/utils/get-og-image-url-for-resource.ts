import { env } from '@/env.mjs'

export const getOGImageUrlForResource = (
  resource: { slug: string | { current: string }; _updatedAt: string },
  type: string = 'articles',
) => {
  return `${env.NEXT_PUBLIC_URL}/${type}/${resource.slug}/opengraph-image?updatedAt=${resource._updatedAt}`
}
