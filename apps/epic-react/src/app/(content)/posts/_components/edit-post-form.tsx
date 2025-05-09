'use client'

import * as React from 'react'
import { PostMetadataFormFields } from '@/app/(content)/posts/_components/edit-post-form-metadata'
import { MobileEditPostForm } from '@/app/(content)/posts/_components/edit-post-form-mobile'
import { onPostSave } from '@/app/(content)/posts/[slug]/edit/actions'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import { env } from '@/env.mjs'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { Post, PostSchema } from '@/lib/posts'
import { updatePost } from '@/lib/posts-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlusIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { VideoResource } from '@coursebuilder/core/schemas/video-resource'
import { EditResourcesForm } from '@coursebuilder/ui/resources-crud/edit-resources-form'

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
}

export function EditPostForm({
	post,
	videoResourceLoader,
}: Omit<EditPostFormProps, 'form'>) {
	const { forcedTheme: theme } = useTheme()
	const session = useSession()
	const form = useForm<z.infer<typeof PostSchema>>({
		resolver: zodResolver(NewPostFormSchema),
		defaultValues: {
			id: post.id,
			fields: {
				title: post.fields?.title,
				body: post.fields?.body,
				slug: post.fields?.slug,
				visibility: post.fields?.visibility || 'unlisted',
				state: post.fields?.state || 'draft',
				description: post.fields?.description ?? '',
				github: post.fields?.github ?? '',
				gitpod: post.fields?.gitpod ?? '',
			},
		},
	})

	return (
		<EditResourcesForm
			resource={post}
			resourceSchema={PostSchema}
			getResourcePath={(slug) => `/${slug}`}
			updateResource={updatePost}
			form={form}
			availableWorkflows={[]}
			sendResourceChatMessage={sendResourceChatMessage}
			hostUrl={env.NEXT_PUBLIC_PARTY_KIT_URL}
			user={session?.data?.user}
			onSave={onPostSave}
			theme={theme}
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
			<PostMetadataFormFields
				form={form}
				videoResourceLoader={videoResourceLoader}
				post={post}
			/>
		</EditResourcesForm>
	)
}
