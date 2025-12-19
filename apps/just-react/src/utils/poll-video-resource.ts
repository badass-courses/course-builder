import { getVideoResource } from '@/lib/video-resource-query'

import { pollVideoResource as pollResourceBase } from '@coursebuilder/utils-media/video-resource'

/**
 * Polls a video resource by ID with exponential backoff until it exists or maximum attempts are reached
 *
 * @param videoResourceId - The unique identifier of the video resource to poll for
 * @param maxAttempts - Maximum number of attempts before giving up (default: 30)
 * @param initialDelay - Initial delay in milliseconds between attempts (default: 250ms)
 * @param delayIncrement - Amount to increase delay by after each attempt (default: 250ms)
 *
 * @returns An async generator that yields the video resource once found
 * @throws Error if the resource is not found after maximum attempts
 */
export async function* pollVideoResource(
	videoResourceId: string,
	maxAttempts = 30,
	initialDelay = 250,
	delayIncrement = 250,
) {
	yield* pollResourceBase(
		videoResourceId,
		getVideoResource,
		maxAttempts,
		initialDelay,
		delayIncrement,
	)
}
