'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ContentVideoResourceField } from '@/components/content/content-video-resource-field'
import type { Post } from '@/lib/posts'
import { updatePost } from '@/lib/posts-query'
import type { UseFormReturn } from 'react-hook-form'

import { VideoResource } from '@coursebuilder/core/schemas'

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
	const router = useRouter()

	// Use videoResource.id if available, otherwise fall back to initialVideoResourceId
	const videoId = videoResource?.id || initialVideoResourceId

	return (
		<ContentVideoResourceField
			videoResource={videoResource}
			resource={post}
			form={form}
			label={label}
			thumbnailEnabled={true}
			showTranscript={true}
			onVideoUpdate={async (resourceId, videoResourceId, additionalFields) => {
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
								...post.fields,
								thumbnailTime: additionalFields.thumbnailTime,
								videoResourceId, // This is added dynamically to the fields
							} as any,
						},
						'save',
					)
				}

				// Refresh the UI
				router.refresh()
			}}
		/>
	)
}
