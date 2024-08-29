import * as React from 'react'
import { useRouter } from 'next/navigation'
import { VideoUploader } from '@/components/resources-crud/video-uploader'
import { pollVideoResource } from '@/utils/poll-video-resource'

export function NewLessonVideoForm({
	parentResourceId,
	onVideoResourceCreated,
	onVideoUploadCompleted,
	moduleSlugOrId,
}: {
	parentResourceId: string
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
		<VideoUploader
			setVideoResourceId={handleSetVideoResourceId}
			parentResourceId={parentResourceId}
		/>
	)
}
