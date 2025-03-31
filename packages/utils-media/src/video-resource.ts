/**
 * Polls a video resource by ID with exponential backoff until it exists or maximum attempts are reached
 *
 * This utility function helps handle scenarios where a video resource might not be immediately
 * available after creation (such as during processing). It repeatedly attempts to fetch the
 * resource with increasing delay between attempts until the resource is found or maximum attempts
 * are reached.
 *
 * @param resourceId - The unique identifier of the video resource to poll for
 * @param getResource - A function that retrieves the resource by ID (returns null/undefined if not found)
 * @param maxAttempts - Maximum number of attempts before giving up (default: 30)
 * @param initialDelay - Initial delay in milliseconds between attempts (default: 250ms)
 * @param delayIncrement - Amount to increase delay by after each attempt (default: 250ms)
 *
 * @returns An async generator that yields the resource once found
 * @throws Error if the resource is not found after maximum attempts
 *
 * @example
 * ```ts
 * // Basic usage with a getVideoResource function
 * import { getVideoResource } from '@/lib/video-resource-query'
 *
 * async function fetchVideoWithPolling(videoId: string) {
 *   const generator = pollVideoResource(videoId, getVideoResource)
 *   const { value } = await generator.next()
 *   return value
 * }
 *
 * // Generic usage with any resource type
 * import { getProduct } from '@/lib/products-query'
 *
 * async function fetchProductWithPolling(productId: string) {
 *   const generator = pollVideoResource(productId, getProduct)
 *   const { value } = await generator.next()
 *   return value
 * }
 * ```
 */
export async function* pollVideoResource<T>(
	resourceId: string,
	getResource: (id: string) => Promise<T | null | undefined>,
	maxAttempts = 30,
	initialDelay = 250,
	delayIncrement = 250,
) {
	let delay = initialDelay

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		const resource = await getResource(resourceId)
		if (resource) {
			yield resource
			return
		}

		await new Promise((resolve) => setTimeout(resolve, delay))
		delay += delayIncrement
	}

	throw new Error('Resource not found after maximum attempts')
}
