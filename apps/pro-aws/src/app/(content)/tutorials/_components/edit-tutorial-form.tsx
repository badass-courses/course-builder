'use client'

import * as React from 'react'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import TutorialResourcesList from '@/components/tutorial-resources-edit'
import { env } from '@/env.mjs'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { TutorialSchema } from '@/lib/tutorial'
import { updateTutorial } from '@/lib/tutorials-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlusIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { ContentResourceSchema } from '@coursebuilder/core/schemas/content-resource-schema'
import type { ContentResource } from '@coursebuilder/core/types'
import {
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Textarea,
} from '@coursebuilder/ui'
import { EditResourcesFormDesktop } from '@coursebuilder/ui/resources-crud/edit-resources-form-desktop'
import { EditResourcesFormMobile } from '@coursebuilder/ui/resources-crud/edit-resources-form-mobile'
import { MetadataFieldState } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-state'
import { MetadataFieldVisibility } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-visibility'

import { onTutorialSave } from '../[module]/edit/actions'

export function EditTutorialForm({ tutorial }: { tutorial: ContentResource }) {
	const form = useForm<z.infer<typeof ContentResourceSchema>>({
		resolver: zodResolver(ContentResourceSchema),
		defaultValues: {
			id: tutorial.id,
			fields: {
				title: tutorial?.fields?.title || '',
				description: tutorial?.fields?.description || '',
				state: tutorial.fields?.state || 'draft',
				body: tutorial?.fields?.body || '',
				visibility: tutorial.fields?.visibility || 'unlisted',
				coverImage: tutorial?.fields?.coverImage || { url: '', alt: '' },
			},
		},
	})

	const session = useSession()
	const { forcedTheme: theme } = useTheme()

	const isMobile = useIsMobile()

	const ResourceForm = isMobile
		? EditResourcesFormMobile
		: EditResourcesFormDesktop

	return (
		<>
			<ResourceForm
				resource={ContentResourceSchema.merge(
					z.object({
						fields: z.object({
							title: z.string().nullable().optional(),
							slug: z.string(),
							description: z.string(),
							state: z
								.enum(['draft', 'published', 'archived', 'deleted'])
								.default('draft'),
							visibility: z
								.enum(['public', 'private', 'unlisted'])
								.default('unlisted'),
							body: z.string().nullable().optional(),
						}),
					}),
				).parse(tutorial)}
				resourceSchema={TutorialSchema}
				getResourcePath={(slug) => `/tutorials/${slug}`}
				updateResource={updateTutorial}
				form={form}
				availableWorkflows={[
					{
						value: 'tutorial-chat-default-ohvsv',
						label: 'Tutorial Chat',
						default: true,
					},
				]}
				sendResourceChatMessage={sendResourceChatMessage}
				hostUrl={env.NEXT_PUBLIC_PARTY_KIT_URL}
				user={session?.data?.user}
				onSave={onTutorialSave}
				theme={theme}
				tools={[
					{ id: 'assistant' },
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
								belongsToResourceId={tutorial.id}
								uploadDirectory={`tutorials`}
							/>
						),
					},
				]}
			>
				<FormField
					control={form.control}
					render={({ field }) => (
						<FormItem className="px-5">
							<FormLabel className="text-lg font-bold">Title</FormLabel>
							<FormDescription className="mt-2 text-sm">
								A title should summarize the tip and explain what it is about
								clearly.
							</FormDescription>
							<Input {...field} />
							<FormMessage />
						</FormItem>
					)}
					name="fields.title"
				/>
				<MetadataFieldVisibility form={form} />
				<MetadataFieldState form={form} />
				<FormField
					control={form.control}
					render={({ field }) => (
						<FormItem className="px-5">
							<FormLabel className="text-lg font-bold">Description</FormLabel>
							<Textarea {...field} value={field.value || ''} />
							<FormMessage />
						</FormItem>
					)}
					name="fields.description"
				/>
				<div className="px-5">
					<FormLabel className="text-lg font-bold">Cover Image</FormLabel>
					{form.watch('fields.coverImage.url') && (
						<img src={form.watch('fields.coverImage.url')} />
					)}
				</div>
				<FormField
					control={form.control}
					render={({ field }) => (
						<FormItem className="px-5">
							<FormLabel className="">Image URL</FormLabel>
							<Input
								{...field}
								onDrop={(e) => {
									console.log(e)
									const result = e.dataTransfer.getData('text/plain')
									const parsedResult = result.match(/\(([^)]+)\)/)
									if (parsedResult) {
										field.onChange(parsedResult[1])
									}
								}}
								value={field.value || ''}
							/>
							<FormMessage />
						</FormItem>
					)}
					name="fields.coverImage.url"
				/>
				<FormField
					control={form.control}
					render={({ field }) => (
						<FormItem className="px-5">
							<FormLabel className="">Image alt</FormLabel>
							<Input {...field} value={field.value || ''} />
							<FormMessage />
						</FormItem>
					)}
					name="fields.coverImage.alt"
				/>
				<TutorialResourcesList tutorial={tutorial} />
			</ResourceForm>
		</>
	)
}
