import { env } from '@/env.mjs'
import pluralize from 'pluralize'

import { ContentResource } from '@coursebuilder/core/schemas'

export const getOGImageUrlForResource = (
	resource: Partial<ContentResource> & {
		fields?: { slug: string }
		type: string
	},
) => {
	return `${env.NEXT_PUBLIC_URL}/${pluralize(resource.type)}/${resource.fields?.slug}/opengraph-image`
}
