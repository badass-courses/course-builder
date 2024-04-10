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

import { onTutorialSave } from './actions'

export function EditTutorialForm({ tutorial }: { tutorial: ContentResource }) {
	const form = useForm<z.infer<typeof TutorialSchema>>({
		resolver: zodResolver(TutorialSchema),
		defaultValues: {
			id: tutorial.id,
			fields: {
				title: tutorial?.fields?.title,
				description: tutorial?.fields?.description || '',
				body: tutorial?.fields?.body || '',
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
				resource={tutorial as any}
				resourceSchema={TutorialSchema}
				getResourcePath={(slug) => `/tutorials/${slug}`}
				updateResource={updateTutorial}
				form={form}
				availableWorkflows={[
					{ value: 'tip-chat-default-okf8v', label: 'Tip Chat', default: true },
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
