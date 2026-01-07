// Re-export from the shared package
// This file exists for backward compatibility
import { env } from '@/env.mjs'

import { getOGImageUrlForResource as getOGImage } from '@coursebuilder/utils-seo/og-image'

export const getOGImageUrlForResource = (resource: {
	fields?: { slug: string }
	id: string
	updatedAt?: Date | string | null
}) => {
	return getOGImage(resource, env.NEXT_PUBLIC_URL, false)
}
