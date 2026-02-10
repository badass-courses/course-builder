'use client'

import React, { useState } from 'react'
import { env } from '@/env.mjs'
import {
	MARKDOWN_EDITOR_EXTENSIONS,
	ReminderEmailFormSchema,
	useEventEmailReminders,
	type ReminderEmailForm,
} from '@/hooks/use-event-email-reminders'
import type { Email } from '@/lib/emails'
import { api } from '@/trpc/react'
import { EditorView } from '@codemirror/view'
import { zodResolver } from '@hookform/resolvers/zod'
import MarkdownEditor from '@uiw/react-markdown-editor'
import { Loader2, Mail, Pencil, Plus } from 'lucide-react'
import { useTheme } from 'next-themes'
import pluralize from 'pluralize'
import { useForm, type UseFormReturn } from 'react-hook-form'

import type { ContentResourceResource } from '@coursebuilder/core/schemas'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
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
	useToast,
} from '@coursebuilder/ui'
import {
	CourseBuilderEditorThemeDark,
	CourseBuilderEditorThemeLight,
} from '@coursebuilder/ui/codemirror/editor'
import { cn } from '@coursebuilder/utils-ui/cn'

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
			<div className="mb-2 text-lg font-semibold">Emails</div>
			<ul className="flex flex-col gap-2">
				{currentReminderEmails?.map((currentReminderEmail) => {
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
						<span className="text-primary inline-flex cursor-pointer items-center gap-1 text-left font-semibold transition-colors hover:underline">
							{isUpdatingEmailId(email.id) ? (
								<Loader2 className="size-3 animate-spin" />
							) : (
								<Pencil className="size-3" />
							)}
							{email.fields?.title}
						</span>
						<div className="flex flex-col text-left">
							{emailRef?.metadata?.hoursInAdvance && (
								<span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
									{emailRef.metadata.hoursInAdvance} hours before
								</span>
							)}
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
				{!isAttached && (
					<SendNowConfirmDialog eventId={parentResourceId} email={email} />
				)}
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

function SendNowConfirmDialog({
	eventId,
	email,
}: {
	eventId: string
	email: Email
}) {
	const [open, setOpen] = useState(false)
	const { toast } = useToast()

	const { data: preview, isLoading: isLoadingPreview } =
		api.events.previewReminderEmail.useQuery(
			{ eventId, emailId: email.id },
			{ enabled: open },
		)

	const { mutate: sendNow, isPending: isSending } =
		api.events.sendReminderEmailNow.useMutation({
			onSuccess: (result) => {
				setOpen(false)
				toast({
					title: `Sent ${result.sent} email${result.sent !== 1 ? 's' : ''}`,
					description:
						result?.errorCount && result.errorCount > 0
							? `${result.errorCount} failed`
							: 'All emails sent successfully',
					variant:
						result?.errorCount && result.errorCount > 0
							? 'destructive'
							: 'default',
				})
			},
			onError: (error) => {
				toast({
					title: 'Failed to send',
					description: error.message,
					variant: 'destructive',
				})
			},
		})

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button size="sm" variant="outline">
					<Mail className="mr-1 size-3" /> Send Now
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent className="max-w-2xl">
				<AlertDialogHeader>
					<AlertDialogTitle>Send Reminder Email Now</AlertDialogTitle>
					<AlertDialogDescription>
						This will immediately send &ldquo;{email.fields?.title}&rdquo; to
						all event purchasers.
					</AlertDialogDescription>
				</AlertDialogHeader>

				{isLoadingPreview ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="size-6 animate-spin" />
					</div>
				) : preview ? (
					<div className="space-y-4">
						<div>
							<h4 className="mb-2 text-sm font-medium">
								Recipients ({preview.recipientCount})
							</h4>
							<div className="max-h-32 overflow-y-auto rounded border p-2 text-sm">
								{preview.recipients.map((r) => (
									<div key={r.email} className="flex justify-between py-0.5">
										<span>{r.name || 'Unknown'}</span>
										<span className="text-muted-foreground">{r.email}</span>
									</div>
								))}
								{preview.recipientCount === 0 && (
									<p className="text-muted-foreground">No purchasers found</p>
								)}
							</div>
						</div>

						<div>
							<h4 className="mb-1 text-sm font-medium">Subject</h4>
							<div className="bg-muted rounded border p-2 text-sm">
								{preview.subject}
							</div>
						</div>

						<div>
							<h4 className="mb-1 text-sm font-medium">Body Preview</h4>
							<pre className="text-muted-foreground max-h-48 overflow-y-auto whitespace-pre-wrap rounded border p-3 text-sm">
								{preview.body}
							</pre>
						</div>
					</div>
				) : null}

				<AlertDialogFooter>
					<AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={(e) => {
							e.preventDefault()
							sendNow({ eventId, emailId: email.id })
						}}
						disabled={isSending || !preview || preview.recipientCount === 0}
					>
						{isSending ? (
							<>
								<Loader2 className="mr-2 size-4 animate-spin" />
								Sending...
							</>
						) : (
							`Send to ${preview?.recipientCount ?? 0} recipient${
								(preview?.recipientCount ?? 0) !== 1 ? 's' : ''
							}`
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

function HoursInAdvanceEditor({
	eventId,
	emailId,
	currentHours,
	onUpdate,
	isLoading,
}: {
	eventId: string
	emailId: string
	currentHours: number
	onUpdate: (params: {
		eventId: string
		emailId: string
		hoursInAdvance: number
	}) => void
	isLoading: boolean
}) {
	const [hours, setHours] = useState(currentHours)
	const hasChanged = hours !== currentHours

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
