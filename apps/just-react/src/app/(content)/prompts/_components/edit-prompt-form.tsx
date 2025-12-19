'use client'

import * as React from 'react'
import { onPromptSave } from '@/app/(content)/prompts/[slug]/edit/actions'
import { env } from '@/env.mjs'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { PromptSchema, type Prompt } from '@/lib/prompts'
import { updatePrompt } from '@/lib/prompts-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { EditResourcesForm } from '@coursebuilder/ui/resources-crud/edit-resources-form'
import { EditResourcesMetadataFields } from '@coursebuilder/ui/resources-crud/edit-resources-metadata-fields'

type EditPromptFormProps = {
	prompt: Prompt
}

export function EditPromptForm({ prompt }: EditPromptFormProps) {
	const { resolvedTheme } = useTheme()
	const session = useSession()
	const form = useForm<z.infer<typeof PromptSchema>>({
		resolver: zodResolver(PromptSchema),
		defaultValues: {
			...prompt,
			fields: {
				...prompt.fields,
				description: prompt.fields?.description ?? '',
				slug: prompt.fields?.slug ?? '',
			},
		},
	})

	const ResourceForm = EditResourcesForm

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
			user={session?.data?.user}
			onSave={onPromptSave}
			theme={resolvedTheme}
		>
			<EditResourcesMetadataFields form={form} />
		</ResourceForm>
	)
}
