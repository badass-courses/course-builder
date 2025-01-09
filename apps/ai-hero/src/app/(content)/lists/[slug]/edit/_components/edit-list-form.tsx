'use client'

import * as React from 'react'
import { PostMetadataFormFields } from '@/app/(content)/posts/_components/edit-post-form-metadata'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import { env } from '@/env.mjs'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { List, ListSchema } from '@/lib/lists'
import { updateList } from '@/lib/lists-query'
import { Post, PostSchema } from '@/lib/posts'
import { autoUpdatePost, updatePost } from '@/lib/posts-query'
import type { Tag } from '@/lib/tags'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlusIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { ContentResourceSchema } from '@coursebuilder/core/schemas'
import { VideoResource } from '@coursebuilder/core/schemas/video-resource'
import { EditResourcesFormDesktop } from '@coursebuilder/ui/resources-crud/edit-resources-form-desktop'

import { ListMetadataFormFields } from './edit-list-form-metadata'
import ListResoucesEdit from './list-resources-edit'

// import { MobileEditPostForm } from './edit-post-form-mobile'

const NewPostFormSchema = z.object({
	title: z.string().min(2).max(90),
	body: z.string().nullish(),
	visibility: z.enum(['public', 'unlisted', 'private']),
	description: z.string().nullish(),
	github: z.string().nullish(),
	gitpod: z.string().nullish(),
})

export type EditListFormProps = {
	list: List
	form: UseFormReturn<z.infer<typeof ListSchema>>
	children?: React.ReactNode
	availableWorkflows?: { value: string; label: string; default?: boolean }[]
	theme?: string
}

export function EditListForm({ list }: Omit<EditListFormProps, 'form'>) {
	const { forcedTheme: theme } = useTheme()
	const session = useSession()
	const form = useForm<z.infer<typeof ListSchema>>({
		resolver: zodResolver(NewPostFormSchema),
		defaultValues: {
			id: list.id,
			fields: {
				title: list.fields?.title,
				body: list.fields?.body,
				slug: list.fields?.slug,
				type: list.fields?.type,
				visibility: list.fields?.visibility || 'public',
				state: list.fields?.state || 'draft',
				description: list.fields?.description ?? '',
				github: list.fields?.github ?? '',
				gitpod: list.fields?.gitpod ?? '',
			},
		},
	})
	const isMobile = useIsMobile()

	return (
		<EditResourcesFormDesktop
			resource={list}
			resourceSchema={ListSchema}
			getResourcePath={(slug) => `/lists`}
			updateResource={updateList}
			// autoUpdateResource={autoUpdatePost}
			form={form}
			bodyPanelSlot={<ListResoucesEdit list={list} />}
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
							belongsToResourceId={list.id}
							uploadDirectory={`posts`}
						/>
					),
				},
			]}
		>
			<React.Suspense fallback={<div>loading</div>}>
				<ListMetadataFormFields form={form} list={list} />
			</React.Suspense>
		</EditResourcesFormDesktop>
	)
}
