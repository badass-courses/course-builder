import { env } from '@/env.mjs'
import pluralize from 'pluralize'

import { ContentResource } from '@coursebuilder/core/types'

export const getOGImageUrlForResource = (
	resource: ContentResource & { fields?: { slug: string } },
	path?: string,
) => {
	return `${env.NEXT_PUBLIC_URL}/${path || pluralize(resource.type)}/${resource.fields?.slug}/opengraph-image?updatedAt=${resource.updatedAt && encodeURI(resource.updatedAt.toISOString())}`
}
