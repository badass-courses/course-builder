'use client'

import * as React from 'react'
import { PostMetadataFormFields } from '@/app/(content)/posts/_components/edit-post-form-metadata'
import { MobileEditPostForm } from '@/app/(content)/posts/_components/edit-post-form-mobile'
import { onPostSave } from '@/app/(content)/posts/[slug]/edit/actions'
import { env } from '@/env.mjs'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { Post, PostSchema } from '@/lib/posts'
import { updatePost } from '@/lib/posts-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { VideoResource } from '@coursebuilder/core/schemas/video-resource'
import { EditResourcesFormDesktop } from '@coursebuilder/ui/resources-crud/edit-resources-form-desktop'

const NewPostFormSchema = z.object({
	title: z.string().min(2).max(90),
	body: z.string().optional().nullable(),
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
			},
		},
	})
	const isMobile = useIsMobile()

	return isMobile ? (
		<MobileEditPostForm
			post={post}
			form={form}
			videoResourceLoader={videoResourceLoader}
			availableWorkflows={[
				{ value: 'post-chat-default-okf8v', label: 'Post Chat', default: true },
			]}
			theme={theme}
		/>
	) : (
		<EditResourcesFormDesktop
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
		>
			<PostMetadataFormFields
				form={form}
				videoResourceLoader={videoResourceLoader}
				post={post}
			/>
		</EditResourcesFormDesktop>
	)
}
