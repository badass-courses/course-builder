'use client'

import * as React from 'react'
import { DateTimePicker } from '@/app/(content)/events/[slug]/edit/_components/date-time-picker/date-time-picker'
import { onEventSave } from '@/app/(content)/events/[slug]/edit/actions'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import { env } from '@/env.mjs'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { Event, EventSchema } from '@/lib/events'
import { updateResource } from '@/lib/resources-query'
import { EditorView } from '@codemirror/view'
import { zodResolver } from '@hookform/resolvers/zod'
import { parseAbsolute } from '@internationalized/date'
import MarkdownEditor from '@uiw/react-markdown-editor'
import { Calendar, ImagePlusIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Textarea,
} from '@coursebuilder/ui'
import {
	CourseBuilderEditorThemeDark,
	CourseBuilderEditorThemeLight,
} from '@coursebuilder/ui/codemirror/editor'
import { EditResourcesForm } from '@coursebuilder/ui/resources-crud/edit-resources-form'
import { EditResourcesMetadataFields } from '@coursebuilder/ui/resources-crud/edit-resources-metadata-fields'

export function EditEventForm({ event }: { event: Event }) {
	const { data: session } = useSession()
	const { resolvedTheme } = useTheme()
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
				visibility: event.fields.visibility || 'public',
				image: event.fields.image || '',
				description: event.fields.description ?? '',
				details: event.fields.details || '',
				slug: event.fields.slug ?? '',
				timezone: event.fields.timezone || 'America/Los_Angeles',
				attendeeInstructions: event.fields.attendeeInstructions || '',
			},
		},
	})

	const ResourceForm = EditResourcesForm

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
					label: 'Article Chatzz',
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
			theme={resolvedTheme}
		>
			<EventMetadataFormFields form={form} theme={resolvedTheme} />
		</ResourceForm>
	)
}

const EventMetadataFormFields = ({
	form,
	theme,
}: {
	form: UseFormReturn<z.infer<typeof EventSchema>>
	theme?: string
}) => {
	return (
		<EditResourcesMetadataFields form={form}>
			<div className="px-5">
				<FormLabel>Cover Image</FormLabel>
				{form.watch('fields.image') && <img src={form.watch('fields.image')} />}
			</div>
			<FormField
				control={form.control}
				name="fields.image"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel>Image URL</FormLabel>
						<Input
							{...field}
							onDrop={(e) => {
								console.log(e)
								const result = e.dataTransfer.getData('text/plain')
								const parsedResult = result.match(/\(([^)]+)\)/)
								if (parsedResult) {
									field.onChange(parsedResult[1])
								}
							}}
							value={field.value || ''}
						/>
						<FormMessage />
					</FormItem>
				)}
			/>

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
									? parseAbsolute(
											new Date(field.value).toISOString(),
											'America/Los_Angeles',
										)
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
									? parseAbsolute(
											new Date(field.value).toISOString(),
											'America/Los_Angeles',
										)
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
						<Input {...field} readOnly disabled value={field.value || ''} />
						<FormMessage />
					</FormItem>
				)}
			/>

			<Dialog>
				<DialogTrigger asChild>
					<div className="cursor-pointer px-5">
						<FormLabel className="inline-flex items-center text-lg font-semibold">
							<Calendar className="mr-1 size-4" /> Event Details
						</FormLabel>
						<FormDescription>
							Details to be used in Google Calendar for this event.
						</FormDescription>
						<Textarea readOnly value={form.watch('fields.details') ?? ''} />
					</div>
				</DialogTrigger>
				<DialogContent className="scrollbar-thin max-w-(--breakpoint-md) max-h-[500px]">
					<DialogHeader>
						<DialogTitle className="inline-flex items-center text-lg font-semibold">
							<Calendar className="mr-1 size-4" /> Event Details
						</DialogTitle>
						<DialogDescription>
							Details to be used in Google Calendar for this event. Markdown is
							supported.
						</DialogDescription>
					</DialogHeader>
					<FormField
						control={form.control}
						name="fields.details"
						render={({ field }) => (
							<FormItem>
								<MarkdownEditor
									theme={
										(theme === 'dark'
											? CourseBuilderEditorThemeDark
											: CourseBuilderEditorThemeLight) ||
										CourseBuilderEditorThemeDark
									}
									extensions={[EditorView.lineWrapping]}
									height="300px"
									maxHeight="500px"
									onChange={(value) => {
										form.setValue('fields.details', value)
									}}
									value={field.value?.toString()}
								/>
								<FormMessage />
							</FormItem>
						)}
					/>
				</DialogContent>
			</Dialog>

			<Dialog>
				<DialogTrigger asChild>
					<div className="cursor-pointer px-5">
						<FormLabel className="text-lg font-semibold">
							Attendee Instructions
						</FormLabel>
						<FormDescription>
							Instructions for attendees who have registered for this event.
							Displayed on the event page.
						</FormDescription>
						<Textarea
							readOnly
							value={form.watch('fields.attendeeInstructions') ?? ''}
						/>
					</div>
				</DialogTrigger>
				<DialogContent className="scrollbar-thin max-w-(--breakpoint-md) max-h-[500px]">
					<DialogHeader>
						<DialogTitle className="inline-flex items-center text-lg font-semibold">
							Attendee Instructions
						</DialogTitle>
						<DialogDescription>
							Instructions for attendees who have registered for this event.
							Displayed on the event page. Markdown is supported.
						</DialogDescription>
					</DialogHeader>
					<FormField
						control={form.control}
						name="fields.attendeeInstructions"
						render={({ field }) => (
							<FormItem>
								<MarkdownEditor
									theme={
										(theme === 'dark'
											? CourseBuilderEditorThemeDark
											: CourseBuilderEditorThemeLight) ||
										CourseBuilderEditorThemeDark
									}
									extensions={[EditorView.lineWrapping]}
									height="300px"
									maxHeight="500px"
									onChange={(value) => {
										form.setValue('fields.attendeeInstructions', value)
									}}
									value={field.value?.toString()}
								/>
								<FormMessage />
							</FormItem>
						)}
					/>
				</DialogContent>
			</Dialog>
		</EditResourcesMetadataFields>
	)
}
