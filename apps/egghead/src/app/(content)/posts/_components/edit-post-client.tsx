'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

import { EditPostForm } from './edit-post-form'

export function EditPostClient({
	post,
	videoResourceLoader,
	videoResourceId,
	tagLoader,
	instructorLoader,
	latestLessonsLoader,
	isAdmin,
	courseSlug,
	courseContext,
}: {
	post: any
	videoResourceLoader: any
	videoResourceId: string | null | undefined
	tagLoader: any
	instructorLoader: any
	latestLessonsLoader: any
	isAdmin: boolean
	courseSlug: string
	courseContext?: any
}) {
	const router = useRouter()
	const handleResourceEdit = ({ item }: { itemId: string; item: any }) => {
		const lessonSlug = item.fields?.slug
		if (lessonSlug) {
			router.push(`/posts/${courseSlug}/edit?resource=${lessonSlug}`)
		}
	}
	return (
		<EditPostForm
			key={post.id}
			post={post}
			videoResourceLoader={videoResourceLoader}
			videoResourceId={videoResourceId}
			tagLoader={tagLoader}
			instructorLoader={instructorLoader}
			latestLessonsLoader={latestLessonsLoader}
			isAdmin={isAdmin}
			onResourceEdit={handleResourceEdit}
			courseContext={courseContext}
		/>
	)
}
