import * as React from 'react'
import { useRouter } from 'next/navigation'
import { TipUploader } from '@/app/(content)/tips/_components/tip-uploader'
import { addVideoResourceToLesson } from '@/lib/lessons-query'
import { getVideoResource } from '@/lib/video-resource-query'

async function* pollVideoResource(
	videoResourceId: string,
	maxAttempts = 30,
	initialDelay = 250,
	delayIncrement = 250,
) {
	let delay = initialDelay

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		const videoResource = await getVideoResource(videoResourceId)
		if (videoResource) {
			yield videoResource
			return
		}

		await new Promise((resolve) => setTimeout(resolve, delay))
		delay += delayIncrement
	}

	throw new Error('Video resource not found after maximum attempts')
}

export function NewLessonVideoForm({
	lessonId,
	onSuccess,
}: {
	lessonId: string
	onSuccess: (videoResourceId: string) => void
}) {
	const router = useRouter()

	async function handleSetVideoResourceId(videoResourceId: string) {
		try {
			await pollVideoResource(videoResourceId).next()
			await addVideoResourceToLesson({
				videoResourceId,
				lessonId,
			})
			onSuccess(videoResourceId)
			router.refresh()
		} catch (error) {}
	}

	return <TipUploader setVideoResourceId={handleSetVideoResourceId} />
}
