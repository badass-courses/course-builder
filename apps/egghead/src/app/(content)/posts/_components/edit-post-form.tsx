'use client'

import * as React from 'react'
import { PostMetadataFormFields } from '@/app/(content)/posts/_components/edit-post-form-metadata'
import { MobileEditPostForm } from '@/app/(content)/posts/_components/edit-post-form-mobile'
import {
	onPostPublish,
	onPostSave,
} from '@/app/(content)/posts/[slug]/edit/actions'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import { env } from '@/env.mjs'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { Post, PostSchema } from '@/lib/posts'
import { updatePost } from '@/lib/posts-query'
import { EggheadTag } from '@/lib/tags'
import { CompactInstructor } from '@/lib/users'
import { zodResolver } from '@hookform/resolvers/zod'
import {
	CheckIcon,
	ImageIcon,
	ImagePlusIcon,
	ListOrderedIcon,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { VideoResource } from '@coursebuilder/core/schemas/video-resource'
import { EditResourcesForm } from '@coursebuilder/ui/resources-crud/edit-resources-form'

import PublishPostChecklist from './publish-post-checklist'
import { ResourceResourcesList } from './resource-resources-list'

const NewPostFormSchema = z.object({
	title: z.string().min(2).max(90),
	postType: z.enum(['lesson', 'article', 'podcast']),
	body: z.string().nullish(),
	visibility: z.enum(['public', 'unlisted', 'private']),
	access: z.enum(['free', 'pro']),
	description: z.string().nullish(),
	github: z.string().nullish(),
	gitpod: z.string().nullish(),
})

export type EditPostFormProps = {
	post: Post
	videoResourceLoader: Promise<VideoResource | null>
	videoResourceId: string | null | undefined
	tagLoader: Promise<EggheadTag[]>
	instructorLoader: Promise<CompactInstructor[]>
	form: UseFormReturn<z.infer<typeof PostSchema>>
	children?: React.ReactNode
	availableWorkflows?: { value: string; label: string; default?: boolean }[]
	theme?: string
	isAdmin: boolean
}

export function EditPostForm({
	post,
	videoResourceLoader,
	videoResourceId,
	tagLoader,
	instructorLoader,
	isAdmin,
	onResourceEdit,
}: Omit<EditPostFormProps, 'form'> & {
	onResourceEdit?: ({ itemId, item }: { itemId: string; item: any }) => void
}) {
	const { theme } = useTheme()
	const session = useSession()
	const form = useForm<z.infer<typeof PostSchema>>({
		resolver: zodResolver(NewPostFormSchema),
		defaultValues: {
			id: post.id,
			fields: {
				image: post.fields?.image ?? '',
				title: post.fields?.title,
				postType: post.fields?.postType || 'lesson',
				body: post.fields?.body,
				visibility: post.fields?.visibility || 'unlisted',
				access: post.fields?.access || 'pro',
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
			onPublish={onPostPublish}
			theme={theme}
			tools={[
				{
					id: 'resources',
					icon: () => (
						<ListOrderedIcon
							strokeWidth={1.5}
							size={24}
							width={18}
							height={18}
						/>
					),
					toolComponent: (
						<div className="h-(--pane-layout-height) overflow-y-auto py-5">
							<ResourceResourcesList
								resource={post}
								onItemEdit={onResourceEdit}
							/>
						</div>
					),
				},
				{
					id: 'publish-checklist',
					label: 'Publish Checklist',
					icon: () => (
						<CheckIcon strokeWidth={1.5} size={24} width={18} height={18} />
					),
					toolComponent: <PublishPostChecklist key={'post-checklist'} />,
				},
				{ id: 'assistant' },
				...(isAdmin
					? [
							{
								id: 'media',
								icon: () => (
									<ImagePlusIcon
										strokeWidth={1.5}
										size={24}
										width={18}
										height={18}
									/>
								),
								toolComponent: (
									<ImageResourceUploader
										key={'image-uploader'}
										belongsToResourceId={post.id}
										uploadDirectory={`posts`}
									/>
								),
							},
						]
					: []),
			]}
		>
			<PostMetadataFormFields
				form={form}
				videoResourceLoader={videoResourceLoader}
				videoResourceId={videoResourceId}
				tagLoader={tagLoader}
				instructorLoader={instructorLoader}
				post={post}
				isAdmin={isAdmin}
			/>
		</EditResourcesForm>
	)
}
