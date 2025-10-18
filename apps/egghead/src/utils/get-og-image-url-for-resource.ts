/**
 * OG Image URL Generation Utilities
 *
 * Generates OpenGraph image URLs for resources using the new dynamic route pattern.
 * Migration: /api/og?resource=slug -> /api/og/[slug]
 */

import { env } from '@/env.mjs'
import pluralize from 'pluralize'

import { ContentResource } from '@coursebuilder/core/schemas'

/**
 * Generate OG image URL for a resource using the path-based approach
 * (for content types that have dedicated opengraph-image.tsx files)
 *
 * @example
 * ```ts
 * getOGImageUrlForResource(post)
 * // Returns: "https://example.com/posts/my-post/opengraph-image"
 * ```
 */
export const getOGImageUrlForResource = (
	resource: ContentResource & { fields?: { slug: string } },
): string => {
	const pluralizedType = pluralize(resource.type)
	const slug = resource.fields?.slug

	return `${env.NEXT_PUBLIC_URL}/${pluralizedType}/${slug}/opengraph-image`
}

/**
 * Generate OG image URL for a resource using the dynamic API route
 * (for content types that use the /api/og/[slug] endpoint)
 *
 * @example
 * ```ts
 * getOGImageUrlForResourceAPI({
 *   id: '123',
 *   fields: { slug: 'my-post' },
 *   updatedAt: new Date()
 * })
 * // Returns: "https://example.com/api/og/my-post?updatedAt=2025-10-16T12:00:00.000Z"
 * ```
 */
export const getOGImageUrlForResourceAPI = (resource: {
	fields?: { slug: string }
	id: string
	updatedAt?: Date | string | null
}): string => {
	const slug = resource?.fields?.slug || resource.id
	const updatedAt =
		typeof resource.updatedAt === 'string'
			? resource.updatedAt
			: resource.updatedAt?.toISOString()

	return `${env.NEXT_PUBLIC_URL}/api/og/${encodeURIComponent(slug)}${
		updatedAt ? `?updatedAt=${encodeURIComponent(updatedAt)}` : ''
	}`
}
