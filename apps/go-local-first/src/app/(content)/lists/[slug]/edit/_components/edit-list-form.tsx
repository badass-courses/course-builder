'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import { env } from '@/env.mjs'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { List, ListSchema } from '@/lib/lists'
import { updateList } from '@/lib/lists-query'
import type { Tag } from '@/lib/tags'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlusIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { EditResourcesForm } from '@coursebuilder/ui/resources-crud/edit-resources-form'

import { ListMetadataFormFields } from './edit-list-form-metadata'
import ListResoucesEdit from './list-resources-edit'

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
	tagLoader: Promise<Tag[]>
}

export function EditListForm({
	list,
	tagLoader,
}: Omit<EditListFormProps, 'form'>) {
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
				image: list.fields?.image ?? '',
				github: list.fields?.github ?? '',
				gitpod: list.fields?.gitpod ?? '',
			},
		},
	})
	const router = useRouter()
	return (
		<EditResourcesForm
			resource={list}
			onSave={async () => {
				if (form.getValues().fields.slug !== list?.fields?.slug) {
					router.push(`/lists/${form.getValues().fields.slug}/edit`)
				}
			}}
			resourceSchema={ListSchema}
			getResourcePath={(slug) => `/${slug}`}
			updateResource={updateList}
			// autoUpdateResource={autoUpdatePost}
			form={form}
			bodyPanelSlot={<ListResoucesEdit list={list} />}
			availableWorkflows={[
				{
					value: 'prompt_list1',
					label: 'List Chat',
					default: true,
				},
			]}
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
				<ListMetadataFormFields tagLoader={tagLoader} form={form} list={list} />
			</React.Suspense>
		</EditResourcesForm>
	)
}
