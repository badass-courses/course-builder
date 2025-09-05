'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { env } from '@/env.mjs'
import {
	MARKDOWN_EDITOR_EXTENSIONS,
	ReminderEmailFormSchema,
	useEventEmailReminders,
	type ReminderEmailForm,
} from '@/hooks/use-event-email-reminders'
import type { Email } from '@/lib/emails'
import { updateEmail } from '@/lib/emails-query'
import { EditorView } from '@codemirror/view'
import { zodResolver } from '@hookform/resolvers/zod'
import MarkdownEditor from '@uiw/react-markdown-editor'
import { Loader2, Mail, Pencil, Plus } from 'lucide-react'
import { useTheme } from 'next-themes'
import pluralize from 'pluralize'
import { useForm, type UseFormReturn } from 'react-hook-form'
import Markdown from 'react-markdown'

import type {
	ContentResource,
	ContentResourceResource,
} from '@coursebuilder/core/schemas'
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
} from '@coursebuilder/ui'
import {
	CourseBuilderEditorThemeDark,
	CourseBuilderEditorThemeLight,
} from '@coursebuilder/ui/codemirror/editor'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'
import { cn } from '@coursebuilder/utils-ui/cn'

/**
 * @description A reusable component for displaying email reminder items in both attached and detached states
 */
export default function EmailEventRemindersField({
	parentResourceId,
}: {
	parentResourceId: string
}) {
	const {
		eventEmails: eventReminderEmails,
		allEmails: allReminderEmails,
		form: createEmailReminderForm,
		onSubmit: handleCreateEmail,
		isLoading,
		isCreatingAndAttachingEmail,
	} = useEventEmailReminders(parentResourceId)

	const currentReminderEmails = eventReminderEmails

	return (
		<div className="px-5">
			<div className="mb-2 text-lg font-semibold">Reminder Emails</div>
			<ul className="flex flex-col gap-2">
				{currentReminderEmails?.map((currentReminderEmail) => {
					// Find the specific ref that connects this event to this email
					const currentReminderEmailRef = allReminderEmails?.refs.find(
						(r) =>
							r.resourceOfId === parentResourceId &&
							r.resourceId === currentReminderEmail.id,
					)

					return (
						<EmailReminderItem
							className="border-primary/50 bg-card/50 border-dashed transition-all duration-200 ease-in-out"
							isAttached={true}
							key={`current-reminder-email-${currentReminderEmail.id}`}
							email={currentReminderEmail}
							emailRef={currentReminderEmailRef}
							parentResourceId={parentResourceId}
							usedCount={
								allReminderEmails?.refs.filter(
									(r) =>
										r.resourceId === currentReminderEmail.id &&
										r.resourceOfId !== parentResourceId,
								).length
							}
						/>
					)
				})}

				{allReminderEmails?.emails
					.filter((e) => !currentReminderEmails?.find((c) => c.id === e.id))
					.map((email) => {
						const ref = allReminderEmails?.refs.find(
							(r) => r.resourceId === email.id,
						)
						return (
							<>
								<EmailReminderItem
									isAttached={false}
									key={email.id}
									email={email}
									emailRef={ref}
									parentResourceId={parentResourceId}
									usedCount={
										allReminderEmails?.refs.filter(
											(r) =>
												r.resourceId === email.id &&
												r.resourceOfId !== parentResourceId,
										).length
									}
								/>
							</>
						)
					})}
				{isCreatingAndAttachingEmail && (
					<div className="bg-card/50 flex animate-pulse items-center gap-2 rounded-md border px-3 py-2 shadow-sm">
						<Loader2 className="size-4 animate-spin" />
						Creating and attaching email...
					</div>
				)}
			</ul>
			<Dialog modal={true}>
				<DialogTrigger asChild>
					<Button className="mt-2" variant="secondary">
						<Plus className="size-4" /> Create Email
					</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="inline-flex items-center text-lg font-semibold">
							<Mail className="mr-1 size-4" /> Reminder Email for This Event
						</DialogTitle>
						<DialogDescription>
							Set up a reminder email for this event. You can configure how many
							hours in advance to send it. Markdown is supported.
						</DialogDescription>
					</DialogHeader>
					<CreateOrUpdateEmailReminderForm
						form={createEmailReminderForm}
						onSubmit={handleCreateEmail}
					/>
				</DialogContent>
			</Dialog>
		</div>
	)
}

/**
 * @description A reusable component for displaying email reminder items in both attached and detached states
 */
function EmailReminderItem({
	email,
	emailRef,
	isAttached,
	parentResourceId,
	className,
	usedCount,
}: {
	email: Email
	emailRef?: ContentResourceResource
	isAttached: boolean
	parentResourceId: string
	className?: string
	usedCount?: number
}) {
	const {
		attachEmail,
		detachEmail,
		updateEmailHours,
		updateEmail,
		isAttachingEmailId,
		isDetachingEmailId,
		isUpdatingHoursForEmail,
		isUpdatingEmailId,
	} = useEventEmailReminders(parentResourceId)

	const form = useForm<ReminderEmailForm>({
		resolver: zodResolver(ReminderEmailFormSchema),
		defaultValues: {
			emailId: email.id,
			eventId: parentResourceId,
			fields: {
				title: email.fields?.title ?? '',
				subject: email.fields?.subject ?? '',
				body: email.fields?.body ?? '',
			},
			hoursInAdvance: emailRef?.metadata?.hoursInAdvance || 24,
		},
	})

	return (
		<li
			className={cn(
				'flex items-center justify-between gap-2 rounded-md border px-3 py-2 shadow-sm',
				className,
			)}
		>
			<Dialog modal={true}>
				<DialogTrigger>
					<div className="flex flex-col items-start">
						<span className="text-primary inline-flex cursor-pointer items-center gap-2 text-left font-semibold transition-colors hover:underline">
							{email.fields?.title}
							{isUpdatingEmailId(email.id) && (
								<Loader2 className="size-3 animate-spin" />
							)}
						</span>
						<div className="flex flex-col text-left">
							<span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
								{emailRef?.metadata?.hoursInAdvance || (
									<Loader2 className="size-3 animate-spin" />
								)}{' '}
								hours before
							</span>
							{(usedCount ?? 0) > 0 && (
								<span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
									{usedCount} other {pluralize('event', usedCount)} using this
									template
								</span>
							)}
						</div>
					</div>
				</DialogTrigger>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle className="inline-flex items-center text-lg font-semibold">
							<Mail className="mr-1 size-4" /> {email.fields?.title}
						</DialogTitle>
						<DialogDescription>
							Edit the reminder email for this{' '}
							{(usedCount ?? 0) > 0
								? `and ${usedCount} other ${pluralize('event', usedCount)}.`
								: 'event.'}
						</DialogDescription>
					</DialogHeader>
					<CreateOrUpdateEmailReminderForm form={form} onSubmit={updateEmail} />
				</DialogContent>
			</Dialog>
			<div className="flex items-center gap-2">
				{isAttached ? (
					<Button
						size="sm"
						variant="outline"
						type="button"
						disabled={isDetachingEmailId(email.id)}
						onClick={() =>
							detachEmail({
								eventId: parentResourceId,
								emailId: email.id,
							})
						}
					>
						Detach
						{isDetachingEmailId(email.id) && (
							<Loader2 className="size-4 animate-spin" />
						)}
					</Button>
				) : (
					<Button
						size="sm"
						variant="default"
						type="button"
						disabled={isAttachingEmailId(email.id)}
						onClick={() =>
							attachEmail({
								eventId: parentResourceId,
								emailId: email.id,
								hoursInAdvance: emailRef?.metadata?.hoursInAdvance || 24,
							})
						}
					>
						Attach
						{isAttachingEmailId(email.id) && (
							<Loader2 className="size-4 animate-spin" />
						)}
					</Button>
				)}
			</div>
		</li>
	)
}

/**
 * @description A reusable component for creating new email reminders
 */
function CreateOrUpdateEmailReminderForm({
	form,
	onSubmit,
}: {
	form: UseFormReturn<ReminderEmailForm>
	onSubmit: (data: ReminderEmailForm) => void
}) {
	const { theme, forcedTheme } = useTheme()
	const [editorView, setEditorView] = React.useState<EditorView | null>(null)
	const insertAtCursor = (text: string) => {
		if (editorView) {
			const { state } = editorView
			const cursor = state.selection.main.head

			editorView.dispatch({
				changes: {
					from: cursor,
					insert: text,
				},
				selection: {
					anchor: cursor + text.length,
				},
			})
		}
	}

	// Check if form values have changed for updates
	const currentValues = form.watch()
	const defaultValues = form.formState.defaultValues
	const isUpdating = !!currentValues.emailId
	const hasChanges = isUpdating
		? currentValues.fields?.title !== defaultValues?.fields?.title ||
			currentValues.fields?.subject !== defaultValues?.fields?.subject ||
			currentValues.fields?.body !== defaultValues?.fields?.body ||
			currentValues.hoursInAdvance !== defaultValues?.hoursInAdvance
		: true

	return (
		<>
			<Form {...form}>
				<form className="flex flex-col gap-4">
					<FormField
						control={form.control}
						name="fields.title"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Title</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="hoursInAdvance"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Send this many hours before the event</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={1}
										max={168}
										{...field}
										onChange={(e) =>
											field.onChange(parseInt(e.target.value) || 24)
										}
									/>
								</FormControl>
								<FormMessage />
								<div className="text-muted-foreground text-sm">
									Send the reminder email this many hours before the event
									starts (1-168 hours)
								</div>
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="fields.subject"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email Subject</FormLabel>
								<FormControl>
									<Input {...field} value={field.value ?? ''} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="fields.body"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email Body (markdown)</FormLabel>
								<MarkdownEditor
									theme={
										(forcedTheme === 'dark' || theme === 'dark'
											? CourseBuilderEditorThemeDark
											: CourseBuilderEditorThemeLight) ||
										CourseBuilderEditorThemeDark
									}
									extensions={[EditorView.lineWrapping]}
									height="300px"
									maxHeight="500px"
									onChange={(value) => {
										form.setValue('fields.body', value)
									}}
									onUpdate={(viewUpdate) => {
										if (viewUpdate.view && !editorView) {
											setEditorView(viewUpdate.view)
										}
									}}
									value={field.value?.toString()}
								/>
								<div className="inline-flex flex-wrap gap-1">
									{MARKDOWN_EDITOR_EXTENSIONS.map((item) => (
										<button
											type="button"
											onClick={() => {
												insertAtCursor(item)
											}}
											key={item}
											className="bg-card hover:bg-card/80 text-primary hover:text-foreground border-border flex flex-shrink-0 items-center rounded-full border px-2 py-1 text-sm transition-all ease-in-out hover:cursor-pointer"
										>
											{item}
										</button>
									))}
								</div>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="flex w-full flex-col gap-2">
						<DialogTrigger asChild>
							<Button
								disabled={!hasChanges}
								type="button"
								onClick={() => {
									form.handleSubmit(onSubmit)()
								}}
							>
								{isUpdating ? 'Update' : 'Create'}
							</Button>
						</DialogTrigger>
						{isUpdating && (
							<Button
								disabled={!hasChanges}
								variant="outline"
								type="button"
								onClick={() => form.reset()}
							>
								Reset
							</Button>
						)}
					</div>
				</form>
			</Form>
		</>
	)
}

type HoursInAdvanceEditorProps = {
	eventId: string
	emailId: string
	currentHours: number
	onUpdate: (params: {
		eventId: string
		emailId: string
		hoursInAdvance: number
	}) => void
	isLoading: boolean
}

/**
 * @description A component that allows the user to edit the hours in advance for an email reminder
 */
function HoursInAdvanceEditor({
	eventId,
	emailId,
	currentHours,
	onUpdate,
	isLoading,
}: HoursInAdvanceEditorProps) {
	const [hours, setHours] = useState(currentHours)
	const hasChanged = hours !== currentHours

	// Reset local state when currentHours changes (after successful update)
	React.useEffect(() => {
		setHours(currentHours)
	}, [currentHours])

	return (
		<div className="flex items-center gap-2">
			<h3 className="text-muted-foreground mb-1 min-w-[6ch] text-base font-semibold">
				Send this many hours before event:
			</h3>
			<div className="flex items-center gap-2">
				<Input
					type="number"
					min={1}
					max={168}
					value={hours}
					onChange={(e) => setHours(parseInt(e.target.value) || currentHours)}
					className="w-20"
				/>
				{hasChanged && (
					<Button
						type="button"
						onClick={() => {
							onUpdate({ eventId, emailId, hoursInAdvance: hours })
						}}
						size="sm"
						disabled={isLoading}
					>
						Save
						{isLoading && <Loader2 className="ml-1 size-3 animate-spin" />}
					</Button>
				)}
			</div>
		</div>
	)
}
