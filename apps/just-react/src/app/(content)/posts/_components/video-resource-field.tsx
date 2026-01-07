'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ContentVideoResourceField } from '@/components/content/content-video-resource-field'
import { env } from '@/env.mjs'
import { useSocket } from '@/hooks/use-socket'
import {
	VIDEO_ATTACHED_EVENT,
	VIDEO_DETACHED_EVENT,
} from '@/inngest/events/video-attachment'
import type { Post } from '@/lib/posts'
import { updatePost } from '@/lib/posts-query'
import { getVideoResource } from '@/lib/video-resource-query'
import type { UseFormReturn } from 'react-hook-form'

import {
	VideoResource,
	type ContentResource,
} from '@coursebuilder/core/schemas'
import { useToast } from '@coursebuilder/ui'

/**
 * A specialized video resource field component for posts
 * Wraps the generic ContentVideoResourceField with post-specific functionality
 */
export const VideoResourceField: React.FC<{
	form: UseFormReturn<any>
	post: Post
	videoResource?: VideoResource | null
	initialVideoResourceId?: string | null
	label?: string
}> = ({
	form,
	post,
	videoResource,
	initialVideoResourceId,
	label = 'Video',
}) => {
	const { toast } = useToast()
	const [currentVideoResource, setCurrentVideoResource] =
		React.useState<VideoResource | null>(videoResource || null)

	useSocket({
		room: post.id,
		onMessage: async (messageEvent) => {
			try {
				const message = JSON.parse(messageEvent.data)

				if (message.name === VIDEO_ATTACHED_EVENT) {
					console.log('new video asset attached')
					toast({
						title: 'New video asset attached',
					})
					const videoResourceId = message.body?.videoResourceId
					if (videoResourceId) {
						const videoResource = await getVideoResource(videoResourceId)

						setCurrentVideoResource(videoResource)
					} else {
						console.error('Missing videoResourceId in message', message)
					}
				}
				if (message.name === VIDEO_DETACHED_EVENT) {
					console.log('video asset detached')
					toast({
						title: 'Video asset detached',
					})
					setCurrentVideoResource(null)
				}
			} catch (error) {}
		},
	})

	// Use videoResource.id if available, otherwise fall back to initialVideoResourceId
	const videoId = videoResource?.id || initialVideoResourceId

	async function handleVideoUpdate(
		resourceId: string,
		videoResourceId: string,
		additionalFields: any,
	) {
		// Update the form state
		form.setValue('fields.videoResourceId' as any, videoResourceId)

		// If we have thumbnail time, save it to the post
		if (additionalFields?.thumbnailTime) {
			form.setValue(
				'fields.thumbnailTime' as any,
				additionalFields.thumbnailTime,
			)

			// Save changes to the post immediately
			await updatePost(
				{
					id: resourceId,
					fields: {
						...form.watch('fields'),
						thumbnailTime: additionalFields.thumbnailTime,
						videoResourceId, // This is added dynamically to the fields
					} as any,
				},
				'save',
			)
		}
	}

	return (
		<ContentVideoResourceField
			videoResource={currentVideoResource}
			resource={post}
			form={form}
			label={label}
			thumbnailEnabled={true}
			showTranscript={true}
			onVideoUpdate={handleVideoUpdate}
		/>
	)
}
