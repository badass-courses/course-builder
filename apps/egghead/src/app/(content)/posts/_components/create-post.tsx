'use client'

import { useRouter } from 'next/navigation'
import { PostUploader } from '@/app/(content)/posts/_components/post-uploader'
import { NewResourceWithVideoForm } from '@/components/resources-crud/new-resource-with-video-form'
import { PostSchema } from '@/lib/posts'
import { createPost } from '@/lib/posts-query'
import { getVideoResource } from '@/lib/video-resource-query'
import { signOut } from 'next-auth/react'
import pluralize from 'pluralize'

import {
	ContentResourceSchema,
	type ContentResource,
} from '@coursebuilder/core/schemas'
import { Card, CardContent, CardFooter, CardHeader } from '@coursebuilder/ui'

export function CreatePost() {
	const router = useRouter()
	return (
		<Card>
			<CardContent>
				<NewResourceWithVideoForm
					onResourceCreated={async (resource: ContentResource) => {
						router.push(
							`/${pluralize(resource.type)}/${resource.fields?.slug || resource.id}/edit`,
						)
					}}
					createResource={async ({ title, videoResourceId, postType }) => {
						try {
							return ContentResourceSchema.parse(
								await createPost({
									title,
									videoResourceId,
									postType,
								}),
							)
						} catch (error) {
							console.error('🚨 Error creating post', error)
							signOut()
							router.push('/sign-in')
							throw error
						}
					}}
					getVideoResource={getVideoResource}
					availableResourceTypes={['lesson', 'article', 'podcast', 'course']}
				>
					{(handleSetVideoResourceId: (id: string) => void) => {
						return (
							<PostUploader setVideoResourceId={handleSetVideoResourceId} />
						)
					}}
				</NewResourceWithVideoForm>
			</CardContent>
			<CardFooter></CardFooter>
		</Card>
	)
}
