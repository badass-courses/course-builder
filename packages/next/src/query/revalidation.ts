'use server'

import {
	revalidateTag as nextRevalidateTag,
	revalidatePath,
} from 'next/cache.js'

/**
 * Options for revalidation
 */
export interface RevalidationOptions {
	/** Cache tags to revalidate */
	tags?: string[]
	/** URL paths to revalidate */
	paths?: string[]
}

/**
 * Wrapper around Next.js revalidateTag.
 * In Next.js 16, the second argument is a cache life profile.
 *
 * @param tag - The cache tag to revalidate
 * @param profile - Cache life profile (default: 'max')
 */
export function revalidateTag(tag: string, profile: string = 'max'): void {
	nextRevalidateTag(tag, profile)
}

/**
 * Revalidates cache tags and paths, returning the result.
 * Useful for chaining with other operations after mutations.
 *
 * @example
 * ```ts
 * const updatedPost = await updatePostInDb(input)
 * return withRevalidation(updatedPost, {
 *   tags: ['posts', postId],
 *   paths: ['/posts', `/posts/${slug}`],
 * })
 * ```
 */
export function withRevalidation<T>(
	result: T,
	options: RevalidationOptions,
): T {
	options.tags?.forEach((tag) => revalidateTag(tag, 'max'))
	options.paths?.forEach((path) => revalidatePath(path))
	return result
}

/**
 * Revalidates multiple cache tags.
 *
 * @example
 * ```ts
 * revalidateTags(['posts', 'workshop-navigation', postId])
 * ```
 */
export function revalidateTags(tags: string[], profile: string = 'max'): void {
	tags.forEach((tag) => revalidateTag(tag, profile))
}

/**
 * Revalidates multiple paths.
 *
 * @example
 * ```ts
 * revalidatePaths(['/posts', `/posts/${slug}`, '/'])
 * ```
 */
export function revalidatePaths(paths: string[]): void {
	paths.forEach((path) => revalidatePath(path))
}

/**
 * Creates a revalidation config for a specific resource type.
 * Helps standardize cache invalidation patterns.
 *
 * @example
 * ```ts
 * const postRevalidation = createRevalidationConfig('post', {
 *   basePath: '/posts',
 *   additionalTags: ['workshop-navigation'],
 * })
 *
 * // Later:
 * postRevalidation.revalidate(postId, postSlug)
 * ```
 */
export function createRevalidationConfig(
	resourceType: string,
	options?: {
		basePath?: string
		additionalTags?: string[]
	},
) {
	const pluralType = `${resourceType}s`

	return {
		/**
		 * Revalidate caches for this resource type
		 */
		revalidate: (resourceId?: string, slug?: string): void => {
			// Base tags for the resource type
			const tags = [resourceType, pluralType]

			// Add resource-specific tag if ID provided
			if (resourceId) {
				tags.push(resourceId)
			}

			// Add any additional configured tags
			if (options?.additionalTags) {
				tags.push(...options.additionalTags)
			}

			revalidateTags(tags)

			// Revalidate paths if basePath configured
			if (options?.basePath) {
				const paths = [options.basePath]
				if (slug) {
					paths.push(`${options.basePath}/${slug}`)
				}
				revalidatePaths(paths)
			}
		},

		/**
		 * Get the standard tags for this resource type
		 */
		getTags: (resourceId?: string): string[] => {
			const tags = [resourceType, pluralType]
			if (resourceId) {
				tags.push(resourceId)
			}
			if (options?.additionalTags) {
				tags.push(...options.additionalTags)
			}
			return tags
		},
	}
}
