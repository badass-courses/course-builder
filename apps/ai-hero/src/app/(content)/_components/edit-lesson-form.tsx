'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { LessonMetadataFormFields } from '@/app/(content)/_components/edit-lesson-form-metadata'
import { onLessonSave } from '@/app/(content)/tutorials/[module]/[lesson]/edit/actions'
import { env } from '@/env.mjs'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { Lesson, LessonSchema } from '@/lib/lessons'
import { updateLesson } from '@/lib/lessons-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import pluralize from 'pluralize'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { VideoResource } from '@coursebuilder/core/schemas'
import { EditResourcesFormDesktop } from '@coursebuilder/ui/resources-crud/edit-resources-form-desktop'

const NewLessonFormSchema = z.object({
	fields: z.object({
		title: z.string().min(2).max(90),
		body: z.string().optional().nullable(),
	}),
})

export type EditLessonFormProps = {
	lesson: Lesson
	videoResource: VideoResource | null
	form: UseFormReturn<z.infer<typeof LessonSchema>>
	children?: React.ReactNode
	moduleType: 'tutorial' | 'workshop'
	availableWorkflows?: { value: string; label: string; default?: boolean }[]
}

export function EditLessonForm({
	lesson,
	videoResource,
	moduleType,
}: Omit<EditLessonFormProps, 'form'>) {
	const { theme } = useTheme()

	const { module: moduleSlug } = useParams()
	const onLessonSaveWithModule = onLessonSave.bind(
		null,
		`/${pluralize(moduleType)}/${moduleSlug}/`,
	)
	const session = useSession()
	const form = useForm<z.infer<typeof LessonSchema>>({
		resolver: zodResolver(NewLessonFormSchema),
		defaultValues: {
			id: lesson.id,
			fields: {
				title: lesson.fields?.title || '',
				body: lesson.fields?.body || '',
				visibility: lesson.fields?.visibility || 'public',
				state: lesson.fields?.state || 'draft',
				description: lesson.fields?.description || '',
				github: lesson.fields?.github || '',
				gitpod: lesson.fields?.gitpod || '',
			},
		},
	})
	const isMobile = useIsMobile()

	const initialVideoResourceId =
		lesson.resources?.find((resourceJoin) => {
			return resourceJoin.resource.type === 'videoResource'
		})?.resource.id || videoResource?.id

	return (
		<EditResourcesFormDesktop
			resource={lesson}
			resourceSchema={LessonSchema}
			getResourcePath={(slug?: string) =>
				`/${pluralize(moduleType)}/${moduleSlug}/${slug}`
			}
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
