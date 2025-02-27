'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ContentVideoResourceField } from '@/components/content/content-video-resource-field'
import type { Post } from '@/lib/posts'
import { updatePost } from '@/lib/posts-query'
import type { UseFormReturn } from 'react-hook-form'

/**
 * A specialized video resource field component for posts
 * Wraps the generic ContentVideoResourceField with post-specific functionality
 */
export const VideoResourceField: React.FC<{
	form: UseFormReturn<any>
	post: Post
	initialVideoResourceId?: string | null
	label?: string
}> = ({ form, post, initialVideoResourceId, label = 'Video' }) => {
	const router = useRouter()

	return (
		<ContentVideoResourceField
			resource={post}
			form={form}
			initialVideoResourceId={initialVideoResourceId}
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
