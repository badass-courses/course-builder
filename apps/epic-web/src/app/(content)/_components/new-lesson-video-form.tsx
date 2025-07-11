import * as React from 'react'
import { useRouter } from 'next/navigation'
import { PostUploader } from '@/app/posts/_components/post-uploader'
import { addVideoResourceToLesson } from '@/lib/lessons-query'
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
		<PostUploader
			setVideoResourceId={handleSetVideoResourceId}
			parentResourceId={parentResourceId}
		/>
	)
}
