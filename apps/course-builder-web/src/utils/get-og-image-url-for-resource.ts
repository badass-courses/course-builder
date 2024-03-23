import { env } from '@/env.mjs'

export const getOGImageUrlForResource = (
	resource: { slug: string | { current: string }; updatedAt: string },
	type: string = 'articles',
) => {
	return `${env.NEXT_PUBLIC_URL}/${type}/${resource.slug}/opengraph-image?updatedAt=${encodeURI(resource.updatedAt)}`
}
