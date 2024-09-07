import { env } from '@/env.mjs'

import { ContentResource } from '@coursebuilder/core/schemas'

export const getOGImageUrlForResource = (
	resource: ContentResource & { fields?: { slug: string } },
) => {
	return `${env.NEXT_PUBLIC_URL}/api/og?resource=${resource?.fields?.slug || resource.id}${resource.updatedAt ? `&updatedAt=${encodeURI(resource.updatedAt.toISOString())}` : ''}`
}
