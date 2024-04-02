'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { TipUploader } from '@/app/(content)/tips/_components/tip-uploader'
import { addVideoResourceToLesson } from '@/lib/lessons-query'
import { getVideoResource } from '@/lib/video-resource-query'

export function NewLessonVideoForm({ lessonId }: { lessonId: string }) {
	const router = useRouter()

	async function* pollVideoResource(
		videoResourceId: string,
		maxAttempts = 30,
		initialDelay = 250,
		delayIncrement = 250,
	) {
		let delay = initialDelay

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			const videoResource = await getVideoResource(videoResourceId)
			console.log('videoResource', videoResource)
			if (videoResource) {
				yield videoResource
				return
			}

			await new Promise((resolve) => setTimeout(resolve, delay))
			delay += delayIncrement
		}

		throw new Error('Video resource not found after maximum attempts')
	}

	async function handleSetVideoResourceId(videoResourceId: string) {
		try {
			console.log('setVideoResourceId', videoResourceId)
			await pollVideoResource(videoResourceId).next()
			const assoc = await addVideoResourceToLesson({
				videoResourceId,
				lessonId,
			})
			console.log('assoc', assoc)
			router.refresh()
		} catch (error) {}
	}

	return <TipUploader setVideoResourceId={handleSetVideoResourceId} />
}
