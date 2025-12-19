import * as React from 'react'
import { useRouter } from 'next/navigation'
import { addVideoResourceToLesson } from '@/lib/lessons-query'
import { pollVideoResource } from '@/utils/poll-video-resource'

import { PostUploader } from '../posts/_components/post-uploader'

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
		} catch (error) {}
	}

	return (
		<PostUploader
			setVideoResourceId={handleSetVideoResourceId}
			parentResourceId={parentResourceId}
		/>
	)
}
