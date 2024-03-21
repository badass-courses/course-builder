'use client'

import * as React from 'react'
import { EditResourcesFormDesktop } from '@/components/resources-crud/edit-resources-form-desktop'
import { EditResourcesFormMobile } from '@/components/resources-crud/edit-resources-form-mobile'
import { EditResourcesMetadataFields } from '@/components/resources-crud/edit-resources-metadata-fields'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { PromptSchema, type Prompt } from '@/lib/prompts'
import { updatePrompt } from '@/lib/prompts-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

type EditPromptFormProps = {
	prompt: Prompt
}

export function EditPromptForm({ prompt }: EditPromptFormProps) {
	const form = useForm<z.infer<typeof PromptSchema>>({
		resolver: zodResolver(PromptSchema),
		defaultValues: {
			...prompt,
			description: prompt.description ?? '',
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
		>
			<EditResourcesMetadataFields form={form} />
		</ResourceForm>
	)
}
