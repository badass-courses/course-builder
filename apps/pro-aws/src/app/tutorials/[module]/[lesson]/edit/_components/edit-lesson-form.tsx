'use client'

import * as React from 'react'
import { EditResourcesFormDesktop } from '@/components/resources-crud/edit-resources-form-desktop'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { Lesson } from '@/lib/lessons'
import { TipSchema } from '@/lib/tips'
import { updateTip } from '@/lib/tips-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import {
	ContentResource,
	ContentResourceResource,
} from '@coursebuilder/core/types'

const NewTipFormSchema = z.object({
	fields: z.object({
		title: z.string().min(2).max(90),
		body: z.string().optional().nullable(),
	}),
})

export type EditTipFormProps = {
	lesson: Lesson
	form: UseFormReturn<z.infer<typeof TipSchema>>
	children?: React.ReactNode
	availableWorkflows?: { value: string; label: string; default?: boolean }[]
}

export function EditLessonForm({ lesson }: Omit<EditTipFormProps, 'form'>) {
	const form = useForm<z.infer<typeof TipSchema>>({
		resolver: zodResolver(NewTipFormSchema),
		defaultValues: {
			id: lesson.id,
			fields: {
				title: lesson.fields?.title || '',
				body: lesson.fields?.body || '',
			},
		},
	})
	const isMobile = useIsMobile()

	return (
		<EditResourcesFormDesktop
			resource={lesson}
			resourceSchema={TipSchema}
			getResourcePath={(slug) => `/tips/${slug}`}
			updateResource={updateTip}
			form={form}
			availableWorkflows={[
				{ value: 'tip-chat-default-okf8v', label: 'Tip Chat', default: true },
			]}
		></EditResourcesFormDesktop>
	)
}
