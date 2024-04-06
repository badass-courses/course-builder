import { getVideoResource } from '@/lib/video-resource-query'

export async function* pollVideoResource(
	videoResourceId: string,
	maxAttempts = 30,
	initialDelay = 250,
	delayIncrement = 250,
) {
	let delay = initialDelay

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		const videoResource = await await getVideoResource(videoResourceId)
		if (videoResource) {
			yield videoResource
			return
		}

		await new Promise((resolve) => setTimeout(resolve, delay))
		delay += delayIncrement
	}

	throw new Error('Video resource not found after maximum attempts')
}
