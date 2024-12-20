'use client'

import { useRouter } from 'next/navigation'
import { PostUploader } from '@/app/(content)/posts/_components/post-uploader'
import { createPost } from '@/lib/posts-server-functions'
import { getVideoResource } from '@/lib/video-resource-query'
import pluralize from 'pluralize'

import {
	ContentResourceSchema,
	type ContentResource,
} from '@coursebuilder/core/schemas'
import { Card, CardContent, CardFooter, CardHeader } from '@coursebuilder/ui'
import { NewResourceWithVideoForm } from '@coursebuilder/ui/resources-crud/new-resource-with-video-form'

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
					createResource={async ({ title, videoResourceId }) => {
						return ContentResourceSchema.parse(
							await createPost({
								title,
								videoResourceId,
							}),
						)
					}}
					getVideoResource={getVideoResource}
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
