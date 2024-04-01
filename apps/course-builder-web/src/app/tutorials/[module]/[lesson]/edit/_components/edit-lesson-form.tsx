'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { onLessonSave } from '@/app/tutorials/[module]/[lesson]/edit/actions'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import { env } from '@/env.mjs'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { Lesson } from '@/lib/lessons'
import { TipSchema } from '@/lib/tips'
import { updateTip } from '@/lib/tips-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlusIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { EditResourcesFormDesktop } from '@coursebuilder/ui/resources-crud/edit-resources-form-desktop'

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
	const { module } = useParams()
	const onLessonSaveWithModule = onLessonSave.bind(
		null,
		`/tutorials/${module}/`,
	)
	const session = useSession()
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
			getResourcePath={(slug?: string) => `/tips/${slug}`}
			updateResource={updateTip}
			form={form}
			availableWorkflows={[
				{ value: 'tip-chat-default-okf8v', label: 'Tip Chat', default: true },
			]}
			sendResourceChatMessage={sendResourceChatMessage}
			hostUrl={env.NEXT_PUBLIC_PARTY_KIT_URL}
			user={session?.data?.user}
			onSave={onLessonSaveWithModule}
			tools={[
				{
					id: 'media',
					icon: () => (
						<ImagePlusIcon strokeWidth={1.5} size={24} width={18} height={18} />
					),
					toolComponent: (
						<ImageResourceUploader
							belongsToResourceId={lesson.id}
							uploadDirectory={`lessons`}
						/>
					),
				},
			]}
		></EditResourcesFormDesktop>
	)
}
