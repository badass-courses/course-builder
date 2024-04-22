'use client'

import * as React from 'react'
import { onPromptSave } from '@/app/(content)/prompts/[slug]/edit/actions'
import { env } from '@/env.mjs'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { PromptSchema, type Prompt } from '@/lib/prompts'
import { updatePrompt } from '@/lib/prompts-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
} from '@coursebuilder/ui'
import { EditResourcesFormDesktop } from '@coursebuilder/ui/resources-crud/edit-resources-form-desktop'
import { EditResourcesFormMobile } from '@coursebuilder/ui/resources-crud/edit-resources-form-mobile'
import { EditResourcesMetadataFields } from '@coursebuilder/ui/resources-crud/edit-resources-metadata-fields'

type EditPromptFormProps = {
	prompt: Prompt
}

export function EditPromptForm({ prompt }: EditPromptFormProps) {
	const { data: session } = useSession()
	const form = useForm<z.infer<typeof PromptSchema>>({
		resolver: zodResolver(PromptSchema),
		defaultValues: {
			...prompt,
			fields: {
				...prompt.fields,
				title: prompt.fields.title || '',
				description: prompt.fields.description ?? '',
				slug: prompt.fields.slug ?? '',
			},
		},
	})

	const isMobile = useIsMobile()

	const ResourceForm = isMobile
		? EditResourcesFormMobile
		: EditResourcesFormDesktop

	return (
		<ResourceForm
			resource={prompt}
			form={form}
			resourceSchema={PromptSchema}
			getResourcePath={(slug) => `/prompts/${slug}`}
			updateResource={updatePrompt}
			availableWorkflows={[
				{
					value: 'prompt-prompt-default-g8v77',
					label: 'Prompt Chat',
					default: true,
				},
			]}
			sendResourceChatMessage={sendResourceChatMessage}
			hostUrl={env.NEXT_PUBLIC_PARTY_KIT_URL}
			user={session?.user}
			onSave={onPromptSave}
		>
			<EditResourcesMetadataFields form={form}>
				<FormField
					control={form.control}
					name="fields.model"
					render={({ field }) => (
						<FormItem className="px-5">
							<FormLabel>Model</FormLabel>
							<FormDescription>The Model to use for the prompt</FormDescription>
							<Input {...field} />
							<FormMessage />
						</FormItem>
					)}
				/>
			</EditResourcesMetadataFields>
		</ResourceForm>
	)
}
