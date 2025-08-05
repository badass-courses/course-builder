// Re-export from the shared package
// This file exists for backward compatibility
import { env } from '@/env.mjs'
import pluralize from 'pluralize'

import { ContentResource } from '@coursebuilder/core/schemas'
import {
	getOGImageUrlForContentResource,
	getOGImageUrlForResource as getOGImageUrlForResourceBase,
} from '@coursebuilder/utils-seo/og-image'

/**
 * Generate OG image URL for a resource using the path-based approach
 * (for content types that have dedicated opengraph-image.tsx files)
 */
export const getOGImageUrlForResource = (
	resource: ContentResource & { fields?: { slug: string } },
) => {
	return getOGImageUrlForContentResource(
		resource,
		env.NEXT_PUBLIC_URL,
		pluralize,
	)
}

/**
 * Generate OG image URL for a resource using the API-based approach
 * (for content types that use the /api/og endpoint)
 */
export const getOGImageUrlForResourceAPI = (resource: {
	fields?: { slug: string }
	id: string
	updatedAt?: Date | string | null
}) => {
	return getOGImageUrlForResourceBase(resource, env.NEXT_PUBLIC_URL)
}
