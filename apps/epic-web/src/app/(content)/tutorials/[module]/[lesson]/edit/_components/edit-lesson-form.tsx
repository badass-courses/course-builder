'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { LessonMetadataFormFields } from '@/app/(content)/tutorials/[module]/[lesson]/edit/_components/edit-lesson-form-metadata'
import { onLessonSave } from '@/app/(content)/tutorials/[module]/[lesson]/edit/actions'
import { env } from '@/env.mjs'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { Lesson } from '@/lib/lessons'
import { updateLesson } from '@/lib/lessons-query'
import { TipSchema } from '@/lib/tips'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { EditResourcesFormDesktop } from '@coursebuilder/ui/resources-crud/edit-resources-form-desktop'

const NewLessonFormSchema = z.object({
	fields: z.object({
		title: z.string().min(2).max(90),
		body: z.string().optional().nullable(),
	}),
})

export type EditLessonFormProps = {
	lesson: Lesson
	form: UseFormReturn<z.infer<typeof TipSchema>>
	children?: React.ReactNode
	availableWorkflows?: { value: string; label: string; default?: boolean }[]
}

export function EditLessonForm({ lesson }: Omit<EditLessonFormProps, 'form'>) {
	const { forcedTheme: theme } = useTheme()

	const { module: moduleSlug } = useParams()
	const onLessonSaveWithModule = onLessonSave.bind(
		null,
		`/tutorials/${moduleSlug}/`,
	)
	const session = useSession()
	const form = useForm<z.infer<typeof TipSchema>>({
		resolver: zodResolver(NewLessonFormSchema),
		defaultValues: {
			id: lesson.id,
			fields: {
				title: lesson.fields?.title || '',
				body: lesson.fields?.body || '',
				visibility: lesson.fields?.visibility || 'unlisted',
				state: lesson.fields?.state || 'draft',
			},
		},
	})
	const isMobile = useIsMobile()

	const initialVideoResourceId = lesson.resources?.find((resourceJoin) => {
		return resourceJoin.resource.type === 'videoResource'
	})?.resource.id

	return (
		<EditResourcesFormDesktop
			resource={lesson}
			resourceSchema={TipSchema}
			getResourcePath={(slug?: string) => `/tutorials/${moduleSlug}/${slug}`}
			updateResource={updateLesson}
			form={form}
			availableWorkflows={[
				{ value: 'tip-chat-default-okf8v', label: 'Tip Chat', default: true },
			]}
			sendResourceChatMessage={sendResourceChatMessage}
			hostUrl={env.NEXT_PUBLIC_PARTY_KIT_URL}
			user={session?.data?.user}
			onSave={onLessonSaveWithModule}
			theme={theme}
		>
			<LessonMetadataFormFields
				initialVideoResourceId={initialVideoResourceId}
				form={form}
				lesson={lesson}
			/>
		</EditResourcesFormDesktop>
	)
}
