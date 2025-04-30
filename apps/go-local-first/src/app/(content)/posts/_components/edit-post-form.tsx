'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { PostMetadataFormFields } from '@/app/(content)/posts/_components/edit-post-form-metadata'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import { env } from '@/env.mjs'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import type { List } from '@/lib/lists'
import { Post, PostSchema } from '@/lib/posts'
import { autoUpdatePost, updatePost } from '@/lib/posts-query'
import type { Tag } from '@/lib/tags'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlusIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { VideoResource } from '@coursebuilder/core/schemas/video-resource'
import { EditResourcesForm } from '@coursebuilder/ui/resources-crud/edit-resources-form'

import { MobileEditPostForm } from './edit-post-form-mobile'

const NewPostFormSchema = z.object({
	title: z.string().min(2).max(90),
	body: z.string().nullish(),
	visibility: z.enum(['public', 'unlisted', 'private']),
	description: z.string().nullish(),
	github: z.string().nullish(),
	gitpod: z.string().nullish(),
})

export type EditPostFormProps = {
	post: Post
	videoResourceLoader: Promise<VideoResource | null>
	form: UseFormReturn<z.infer<typeof PostSchema>>
	children?: React.ReactNode
	availableWorkflows?: { value: string; label: string; default?: boolean }[]
	theme?: string
	tagLoader: Promise<Tag[]>
	listsLoader: Promise<List[]>
}

export function EditPostForm({
	post,
	videoResourceLoader,
	tagLoader,
	listsLoader,
}: Omit<EditPostFormProps, 'form'>) {
	const { theme } = useTheme()
	const session = useSession()
	const form = useForm<z.infer<typeof PostSchema>>({
		resolver: zodResolver(NewPostFormSchema),
		defaultValues: {
			id: post.id,
			fields: {
				title: post.fields?.title,
				body: post.fields?.body,
				slug: post.fields?.slug,
				visibility: post.fields?.visibility || 'public',
				state: post.fields?.state || 'draft',
				description: post.fields?.description ?? '',
				github: post.fields?.github ?? '',
				gitpod: post.fields?.gitpod ?? '',
			},
		},
	})

	const videoResource = videoResourceLoader
		? React.use(videoResourceLoader)
		: null
	const router = useRouter()

	return (
		<EditResourcesForm
			resource={post}
			onSave={async () => {
				if (form.getValues().fields.slug !== post?.fields?.slug) {
					router.push(`/posts/${form.getValues().fields.slug}/edit`)
				}
			}}
			resourceSchema={PostSchema}
			getResourcePath={(slug) => `/${slug}`}
			updateResource={updatePost}
			autoUpdateResource={autoUpdatePost}
			form={form}
			availableWorkflows={[]}
			sendResourceChatMessage={sendResourceChatMessage}
			hostUrl={env.NEXT_PUBLIC_PARTY_KIT_URL}
			user={session?.data?.user}
			theme={theme}
			onResourceBodyChange={() => {}}
			tools={[
				{ id: 'assistant' },
				{
					id: 'media',
					icon: () => (
						<ImagePlusIcon strokeWidth={1.5} size={24} width={18} height={18} />
					),
					toolComponent: (
						<ImageResourceUploader
							key={'image-uploader'}
							belongsToResourceId={post.id}
							uploadDirectory={`posts`}
						/>
					),
				},
			]}
		>
			<React.Suspense fallback={<div>loading</div>}>
				<PostMetadataFormFields
					listsLoader={listsLoader}
					tagLoader={tagLoader}
					form={form}
					videoResourceLoader={videoResourceLoader}
					videoResourceId={videoResource?.id}
					post={post}
				/>
			</React.Suspense>
		</EditResourcesForm>
	)
}
