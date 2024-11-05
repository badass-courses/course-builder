'use client'

import * as React from 'react'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import WorkshopResourcesList from '@/components/workshop-resources-edit'
import { env } from '@/env.mjs'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { ModuleSchema } from '@/lib/module'
import { updateWorkshop } from '@/lib/workshops-query'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlusIcon, ListOrderedIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { ContentResourceSchema } from '@coursebuilder/core/schemas/content-resource-schema'
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
import { MetadataFieldSocialImage } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-social-image'
import { MetadataFieldState } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-state'
import { MetadataFieldVisibility } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-visibility'

import { onWorkshopSave } from '../[module]/edit/actions'

export function EditWorkshopForm({ workshop }: { workshop: ContentResource }) {
	const form = useForm<z.infer<typeof ModuleSchema>>({
		resolver: zodResolver(ModuleSchema),
		defaultValues: {
			id: workshop.id,
			fields: {
				title: workshop?.fields?.title || '',
				description: workshop?.fields?.description || '',
				slug: workshop?.fields?.slug,
				state: workshop.fields?.state || 'draft',
				body: workshop?.fields?.body || '',
				visibility: workshop.fields?.visibility || 'unlisted',
				coverImage: workshop?.fields?.coverImage || { url: '', alt: '' },
				github: workshop?.fields?.github || '',
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
							description: z.string().nullable().optional(),
							state: z
								.enum(['draft', 'published', 'archived', 'deleted'])
								.default('draft'),
							visibility: z
								.enum(['public', 'private', 'unlisted'])
								.default('unlisted'),
							body: z.string().nullable().optional(),
						}),
					}),
				).parse(workshop)}
				resourceSchema={ContentResourceSchema}
				getResourcePath={(slug) => `/workshops/${slug}`}
				updateResource={updateWorkshop}
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
				onSave={onWorkshopSave}
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
								belongsToResourceId={workshop.id}
								uploadDirectory={`workshops`}
							/>
						),
					},
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
							<div className="h-[var(--pane-layout-height)] overflow-y-auto py-5">
								<WorkshopResourcesList workshop={workshop} />
							</div>
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
				<FormField
					control={form.control}
					render={({ field }) => (
						<FormItem className="px-5">
							<FormLabel className="text-lg font-bold">GitHub</FormLabel>
							<Input {...field} value={field.value || ''} />
							<FormMessage />
						</FormItem>
					)}
					name="fields.github"
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
							<FormLabel className="">Cover Image URL</FormLabel>
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
							<FormLabel className="">Cover Image alt</FormLabel>
							<Input {...field} value={field.value || ''} />
							<FormMessage />
						</FormItem>
					)}
					name="fields.coverImage.alt"
				/>
				<MetadataFieldSocialImage
					form={form}
					currentSocialImage={getOGImageUrlForResource(
						form.getValues() as unknown as ContentResource & {
							fields?: { slug: string }
						},
					)}
				/>
				{/* <WorkshopResourcesList workshop={workshop} /> */}
			</ResourceForm>
		</>
	)
}
