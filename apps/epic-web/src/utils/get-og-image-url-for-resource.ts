// Re-export from the shared package
// This file exists for backward compatibility
import { env } from '@/env.mjs'
import pluralize from 'pluralize'

import { ContentResource } from '@coursebuilder/core/schemas'
import { getOGImageUrlForContentResource } from '@coursebuilder/utils-seo/og-image'

export const getOGImageUrlForResource = (
	resource: ContentResource & { fields?: { slug: string } },
) => {
	return getOGImageUrlForContentResource(
		resource,
		env.NEXT_PUBLIC_URL,
		pluralize,
	)
}
