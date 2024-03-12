'use client'

import * as React from 'react'
import { EditResourcesDesktopForm } from '@/components/resources-crud/edit-resources-desktop-form'
import { EditResourcesMetadataFields } from '@/components/resources-crud/edit-resources-metadata-fields'
import { EditResourcesMobileForm } from '@/components/resources-crud/edit-resources-mobile-form'
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

  const ResourceForm = isMobile ? EditResourcesMobileForm : EditResourcesDesktopForm

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
