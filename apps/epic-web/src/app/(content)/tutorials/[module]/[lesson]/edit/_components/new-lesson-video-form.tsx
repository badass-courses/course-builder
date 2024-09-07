import * as React from 'react'
import { useRouter } from 'next/navigation'
import { TipUploader } from '@/app/(content)/tips/_components/tip-uploader'
import { addVideoResourceToLesson } from '@/lib/lessons-query'
import { pollVideoResource } from '@/utils/poll-video-resource'

export function NewLessonVideoForm({
	lessonId,
	onVideoResourceCreated,
	onVideoUploadCompleted,
	moduleSlugOrId,
}: {
	lessonId: string
	onVideoResourceCreated: (videoResourceId: string) => void
	onVideoUploadCompleted: (videoResourceId: string) => void
	moduleSlugOrId?: string
}) {
	const router = useRouter()

	async function handleSetVideoResourceId(videoResourceId: string) {
		try {
			onVideoUploadCompleted(videoResourceId)
			await pollVideoResource(videoResourceId).next()
			onVideoResourceCreated(videoResourceId)
			router.refresh()
		} catch (error) {}
	}

	return (
		<TipUploader
			setVideoResourceId={handleSetVideoResourceId}
			parentResourceId={lessonId}
		/>
	)
}
