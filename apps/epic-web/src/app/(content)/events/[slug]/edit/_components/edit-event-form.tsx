'use client'

import * as React from 'react'
import { DateTimePicker } from '@/app/(content)/events/[slug]/edit/_components/date-time-picker/date-time-picker'
import { onEventSave } from '@/app/(content)/events/[slug]/edit/actions'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import { env } from '@/env.mjs'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { Event, EventSchema } from '@/lib/events'
import { updateResource } from '@/lib/resources-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { parseAbsolute } from '@internationalized/date'
import { ImagePlusIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import {
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
} from '@coursebuilder/ui'
import { EditResourcesFormDesktop } from '@coursebuilder/ui/resources-crud/edit-resources-form-desktop'
import { EditResourcesFormMobile } from '@coursebuilder/ui/resources-crud/edit-resources-form-mobile'
import { EditResourcesMetadataFields } from '@coursebuilder/ui/resources-crud/edit-resources-metadata-fields'

export function EditEventForm({ event }: { event: Event }) {
	const { data: session } = useSession()
	const { theme } = useTheme()
	const form = useForm<z.infer<typeof EventSchema>>({
		resolver: zodResolver(EventSchema),
		defaultValues: {
			...event,
			fields: {
				...event.fields,
				...(event.fields.startsAt && {
					startsAt: new Date(event.fields.startsAt).toISOString(),
				}),
				...(event.fields.endsAt && {
					endsAt: new Date(event.fields.endsAt).toISOString(),
				}),
				title: event.fields.title || '',
				description: event.fields.description ?? '',
				slug: event.fields.slug ?? '',
				timezone: event.fields.timezone || 'America/Los_Angeles',
			},
		},
	})

	const isMobile = useIsMobile()

	const ResourceForm = isMobile
		? EditResourcesFormMobile
		: EditResourcesFormDesktop

	return (
		<ResourceForm
			resource={event}
			form={form}
			resourceSchema={EventSchema}
			getResourcePath={(slug?: string) => `/events/${slug}`}
			updateResource={updateResource}
			onSave={onEventSave}
			availableWorkflows={[
				{
					value: 'article-chat-default-5aj1o',
					label: 'Article Chat',
					default: true,
				},
			]}
			sendResourceChatMessage={sendResourceChatMessage}
			hostUrl={env.NEXT_PUBLIC_PARTY_KIT_URL}
			user={session?.user}
			tools={[
				{ id: 'assistant' },
				{
					id: 'media',
					icon: () => (
						<ImagePlusIcon strokeWidth={1.5} size={24} width={18} height={18} />
					),
					toolComponent: (
						<ImageResourceUploader
							key={'image-uploader'}
							belongsToResourceId={event.id}
							uploadDirectory={`events`}
						/>
					),
				},
			]}
			theme={theme}
		>
			<EventMetadataFormFields form={form} />
		</ResourceForm>
	)
}

const EventMetadataFormFields = ({
	form,
}: {
	form: UseFormReturn<z.infer<typeof EventSchema>>
}) => {
	return (
		<EditResourcesMetadataFields form={form}>
			<FormField
				control={form.control}
				name="fields.startsAt"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel>Starts At:</FormLabel>
						<DateTimePicker
							{...field}
							value={
								!!field.value
									? parseAbsolute(field.value, 'America/Los_Angeles')
									: null
							}
							onChange={(date) => {
								field.onChange(
									!!date ? date.toDate('America/Los_Angeles') : null,
								)
							}}
							shouldCloseOnSelect={false}
							granularity="minute"
						/>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="fields.endsAt"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel>Ends At:</FormLabel>
						<DateTimePicker
							{...field}
							value={
								!!field.value
									? parseAbsolute(field.value, 'America/Los_Angeles')
									: null
							}
							onChange={(date) => {
								field.onChange(
									!!date ? date.toDate('America/Los_Angeles') : null,
								)
							}}
							shouldCloseOnSelect={false}
							granularity="minute"
						/>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="fields.timezone"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel>Timezone:</FormLabel>
						<Input {...field} readOnly disabled />
						<FormMessage />
					</FormItem>
				)}
			/>
		</EditResourcesMetadataFields>
	)
}
