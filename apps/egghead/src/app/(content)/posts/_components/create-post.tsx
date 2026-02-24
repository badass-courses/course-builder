'use client'

import { useRouter } from 'next/navigation'
import { createAppAbility } from '@/ability'
import { PostUploader } from '@/app/(content)/posts/_components/post-uploader'
import { NewResourceWithVideoForm } from '@/components/resources-crud/new-resource-with-video-form'
import { EggheadApiError } from '@/errors/egghead-api-error'
import { PostType } from '@/lib/posts'
import { createPost } from '@/lib/posts-query'
import { getVideoResource } from '@/lib/video-resource-query'
import { api } from '@/trpc/react'
import { signOut } from 'next-auth/react'
import pluralize from 'pluralize'

import {
	ContentResourceSchema,
	type ContentResource,
} from '@coursebuilder/core/schemas'
import { Card, CardContent, CardFooter } from '@coursebuilder/ui'

export function CreatePost() {
	const router = useRouter()

	const { data: abilityRules } = api.ability.getCurrentAbilityRules.useQuery()
	const ability = createAppAbility(abilityRules)

	const isAdmin = ability.can('manage', 'all')

	const availableMediaTypes: PostType[] = isAdmin
		? ['lesson', 'article', 'podcast', 'course']
		: ['lesson', 'article', 'course']

	return (
		<Card>
			<CardContent className="p-4">
				<NewResourceWithVideoForm
					uploadEnabled={false}
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
							console.error('error creating post', error)
							if (error instanceof EggheadApiError && error.status === 403) {
								signOut()
								router.push('/sign-in')
							}

							throw error
						}
					}}
					getVideoResource={getVideoResource}
					availableResourceTypes={availableMediaTypes}
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
