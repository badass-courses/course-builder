'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import { env } from '@/env.mjs'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import type { List } from '@/lib/lists'
import { Post, PostSchema } from '@/lib/posts'
import { autoUpdatePost, updatePost } from '@/lib/posts-query'
import type { Tag } from '@/lib/tags'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlusIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useForm, UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { VideoResource } from '@coursebuilder/core/schemas/video-resource'
import { EditResourcesFormDesktop } from '@coursebuilder/ui/resources-crud/edit-resources-form-desktop'

import { MobileEditPostForm } from './edit-post-form-mobile'
import { MetadataFormFieldsSwitcher } from './metadata-form-fields-switcher'

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
	videoResourceId?: string | null | undefined
	form: UseFormReturn<z.infer<typeof PostSchema>>
	children?: React.ReactNode
	availableWorkflows?: { value: string; label: string; default?: boolean }[]
	theme?: string
	tagLoader: Promise<Tag[]>
	listsLoader: Promise<List[]>
	sendResourceChatMessage: (options: {
		resourceId: string
		messages: any[]
		selectedWorkflow?: string
	}) => Promise<void>
}

export function EditPostForm({
	post,
	videoResourceLoader,
	videoResourceId,
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
				thumbnailTime: post.fields?.thumbnailTime ?? 0,
			},
		},
	})
	const isMobile = useIsMobile()
	const videoResource = videoResourceLoader
		? React.use(videoResourceLoader)
		: null
	const router = useRouter()

	return isMobile ? (
		<MobileEditPostForm
			listsLoader={listsLoader}
			tagLoader={tagLoader}
			post={post}
			form={form}
			videoResourceId={videoResource?.id}
			videoResourceLoader={videoResourceLoader}
			availableWorkflows={[
				{ value: 'post-chat-default-okf8v', label: 'Post Chat', default: true },
			]}
			theme={theme}
			sendResourceChatMessage={sendResourceChatMessage}
		/>
	) : (
		<EditResourcesFormDesktop
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
				<MetadataFormFieldsSwitcher
					post={post}
					form={form}
					videoResourceId={videoResource?.id}
					tagLoader={tagLoader}
					listsLoader={listsLoader}
					sendResourceChatMessage={sendResourceChatMessage}
				/>
			</React.Suspense>
		</EditResourcesFormDesktop>
	)
}
