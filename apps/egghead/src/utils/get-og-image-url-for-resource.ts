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
 * Get the proper base URL for OG images that works across both
 * builder.egghead.io and egghead.io domains
 *
 * @returns The base URL to use for OG image generation
 */
export function getOGImageBaseUrl(): string {
	// Use NEXT_PUBLIC_URL if available (for builder.egghead.io)
	if (env.NEXT_PUBLIC_URL) {
		return env.NEXT_PUBLIC_URL
	}

	// Fallback to production egghead.io URL
	if (env.EGGHEAD_PUBLIC_URL) {
		return env.EGGHEAD_PUBLIC_URL
	}

	// Default fallback
	return 'https://builder.egghead.io'
}

/**
 * Generate OG image URL for a resource using the path-based approach
 * (for content types that have dedicated opengraph-image.tsx files)
 */
export const getOGImageUrlForResource = (
	resource: ContentResource & { fields?: { slug: string } },
) => {
	return getOGImageUrlForContentResource(
		resource,
		getOGImageBaseUrl(),
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
	return getOGImageUrlForResourceBase(resource, getOGImageBaseUrl())
}
