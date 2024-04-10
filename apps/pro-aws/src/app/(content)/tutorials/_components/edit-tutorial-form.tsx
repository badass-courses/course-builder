'use client'

import * as React from 'react'
import TutorialResourcesList from '@/components/tutorial-resources-edit'
import { env } from '@/env.mjs'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { TutorialSchema } from '@/lib/tutorial'
import { updateTutorial } from '@/lib/tutorials-query'
import { zodResolver } from '@hookform/resolvers/zod'
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
				<TutorialResourcesList tutorial={tutorial} />
			</ResourceForm>
		</>
	)
}
