'use client'

import Link from 'next/link'
import { env } from '@/env.mjs'
import { NewEmailSchema, type NewEmail } from '@/lib/emails'
import { api } from '@/trpc/react'
import { EditorView } from '@codemirror/view'
import { zodResolver } from '@hookform/resolvers/zod'
import MarkdownEditor from '@uiw/react-markdown-editor'
import { Loader2, Mail, Pencil, Plus } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useForm } from 'react-hook-form'
import Markdown from 'react-markdown'
import { z } from 'zod'

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
	Textarea,
} from '@coursebuilder/ui'
import {
	CourseBuilderEditorThemeDark,
	CourseBuilderEditorThemeLight,
} from '@coursebuilder/ui/codemirror/editor'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

const DEFAULT_EMAIL = {
	title: 'Reminder Email',
	subject: `Tomorrow's {{title}} - Please Review Instructions First! 🚀`,
	body: `Hey everyone!

I'm really looking forward to tomorrow! Please please please, make sure to reserve an hour to go through all of the instructions on
{{url}} before tomorrow starts. It's critical to your success and learning. Otherwise you will spend the first 20 minutes or more missing instruction trying to figure out how things work and in general have a bad time.

But we don't want to have a bad time! We're going to have a good time! So check out and follow the instructions and we'll have an epic time tomorrow. And because this is an advanced workshop, please make sure you check out the resources on the README of the repo as well. See you soon!`,
}

const ReminderEmailFormSchema = NewEmailSchema.extend({
	hoursInAdvance: z.number().min(1).max(168).default(24), // 1 hour to 1 week
})

type ReminderEmailForm = z.infer<typeof ReminderEmailFormSchema>

export default function EmailEventRemindersField({
	parentResourceId,
}: {
	parentResourceId: string
}) {
	const {
		data: eventReminderEmails,
		refetch: refetchEventReminderEmails,
		status: eventReminderEmailsStatus,
	} = api.events.getEventReminderEmails.useQuery({
		eventId: parentResourceId,
	})
	const {
		data: allReminderEmails,
		refetch: refetchAllReminderEmails,
		status: allReminderEmailsStatus,
	} = api.events.getAllEventReminderEmails.useQuery()

	const { mutate: attachReminderEmail, isPending: isAttachingReminderEmail } =
		api.events.attachReminderEmailToEvent.useMutation()
	const { mutate: detachReminderEmail, isPending: isDetachingReminderEmail } =
		api.events.detachReminderEmailFromEvent.useMutation()
	const {
		mutate: createAndAttachReminderEmailToEvent,
		isPending: isCreatingAndAttachingReminderEmail,
	} = api.events.createAndAttachReminderEmailToEvent.useMutation()

	const isLoading =
		eventReminderEmailsStatus === 'pending' ||
		allReminderEmailsStatus === 'pending' ||
		isAttachingReminderEmail ||
		isDetachingReminderEmail ||
		isCreatingAndAttachingReminderEmail

	const form = useForm<ReminderEmailForm>({
		resolver: zodResolver(ReminderEmailFormSchema),
		defaultValues: {
			fields: {
				...DEFAULT_EMAIL,
			},
			hoursInAdvance: 24,
		},
	})
	const onSubmit = (data: ReminderEmailForm) => {
		const { hoursInAdvance, ...emailData } = data
		createAndAttachReminderEmailToEvent(
			{
				eventId: parentResourceId,
				input: emailData,
				hoursInAdvance,
			},
			{
				onSuccess: () => {
					refetchAllReminderEmails()
					refetchEventReminderEmails()
					form.reset()
				},
			},
		)
	}

	const { theme } = useTheme()
	const currentReminderEmail = eventReminderEmails?.[0]

	return (
		<div className="px-5">
			<div className="mb-2 text-lg font-bold">Reminder Email</div>
			<ul className="flex flex-col gap-2">
				{currentReminderEmail && (
					<li
						key={`current-reminder-email-${currentReminderEmail.id}`}
						className="border-primary/50 flex items-center justify-between gap-2 rounded-md border px-3 py-2 shadow-sm"
					>
						<Dialog modal={true}>
							<DialogTrigger asChild>
								<span className="text-primary inline-flex cursor-pointer items-center gap-2 font-semibold transition-colors hover:underline">
									{/* <Mail className="size-4 flex-shrink-0" />{' '} */}
									{currentReminderEmail.fields.title}
								</span>
							</DialogTrigger>
							<DialogContent className="max-w-2xl">
								<DialogHeader>
									<DialogTitle className="inline-flex items-center text-lg font-bold">
										<Mail className="mr-1 size-4" />{' '}
										{currentReminderEmail.fields.title}
									</DialogTitle>
								</DialogHeader>
								<div className="space-y-4">
									<div className="flex items-baseline gap-3">
										<h3 className="text-muted-foreground mb-1 min-w-[6ch] text-base font-semibold">
											From:
										</h3>
										<p className="text-base font-medium">
											{env.NEXT_PUBLIC_SUPPORT_EMAIL}
										</p>
									</div>
									<div className="flex items-baseline gap-3">
										<h3 className="text-muted-foreground mb-1 min-w-[6ch] text-base font-semibold">
											Subject:
										</h3>
										<p className="text-base font-medium">
											{currentReminderEmail.fields.subject || 'No subject'}
										</p>
									</div>
									<div className="flex items-baseline gap-3">
										<h3 className="text-muted-foreground mb-1 min-w-[6ch] text-base font-semibold">
											Body:
										</h3>
										<div className="prose prose-sm bg-muted/30 max-w-none rounded-lg border px-4">
											<div className="prose dark:prose-invert">
												<Markdown>
													{currentReminderEmail.fields.body ||
														'No body content'}
												</Markdown>
											</div>
										</div>
									</div>
								</div>
								<DialogFooter>
									<Button asChild variant="secondary">
										<Link
											href={getResourcePath(
												currentReminderEmail.type,
												currentReminderEmail.fields.slug,
												'edit',
											)}
										>
											<Pencil className="size-3" /> Edit Email
										</Link>
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
						<div className="flex items-center gap-2">
							<Button
								size="sm"
								variant="outline"
								type="button"
								disabled={isLoading}
								onClick={() =>
									detachReminderEmail(
										{
											eventId: parentResourceId,
											emailId: currentReminderEmail.id,
										},
										{
											onSuccess: () => {
												refetchAllReminderEmails()
												refetchEventReminderEmails()
											},
										},
									)
								}
							>
								Detach
								{isLoading && <Loader2 className="size-4 animate-spin" />}
							</Button>
						</div>
					</li>
				)}
				{allReminderEmails
					?.filter((e) => e.id !== currentReminderEmail?.id)
					.map((email) => (
						<li
							key={email.id}
							className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 shadow-sm"
						>
							<Dialog modal={true}>
								<DialogTrigger asChild>
									<span className="text-primary inline-flex cursor-pointer items-center gap-2 font-semibold transition-colors hover:underline">
										{email.fields.title}
									</span>
								</DialogTrigger>
								<DialogContent className="max-w-2xl">
									<DialogHeader>
										<DialogTitle className="inline-flex items-center text-lg font-bold">
											<Mail className="mr-1 size-4" /> {email.fields.title}
										</DialogTitle>
									</DialogHeader>
									<div className="space-y-4">
										<div className="flex items-baseline gap-3">
											<h3 className="text-muted-foreground mb-1 min-w-[6ch] text-base font-semibold">
												From:
											</h3>
											<p className="text-base font-medium">
												{env.NEXT_PUBLIC_SUPPORT_EMAIL}
											</p>
										</div>
										<div className="flex items-baseline gap-3">
											<h3 className="text-muted-foreground mb-1 min-w-[6ch] text-base font-semibold">
												Subject:
											</h3>
											<p className="text-base font-medium">
												{email.fields.subject || 'No subject'}
											</p>
										</div>
										<div className="flex items-baseline gap-3">
											<h3 className="text-muted-foreground mb-1 min-w-[6ch] text-base font-semibold">
												Body:
											</h3>
											<div className="prose prose-sm bg-muted/30 max-w-none rounded-lg border px-4">
												<div className="prose dark:prose-invert">
													<Markdown>
														{email.fields.body || 'No body content'}
													</Markdown>
												</div>
											</div>
										</div>
									</div>
									<DialogFooter>
										<Button asChild variant="secondary">
											<Link
												href={getResourcePath(
													email.type,
													email.fields.slug,
													'edit',
												)}
											>
												<Pencil className="size-3" /> Edit Email
											</Link>
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
							<Button
								size="sm"
								variant="secondary"
								type="button"
								disabled={isLoading}
								onClick={() =>
									attachReminderEmail(
										{
											eventId: parentResourceId,
											emailId: email.id,
										},
										{
											onSuccess: () => {
												refetchAllReminderEmails()
												refetchEventReminderEmails()
											},
										},
									)
								}
							>
								Attach
								{isLoading && <Loader2 className="size-4 animate-spin" />}
							</Button>
						</li>
					))}
			</ul>
			<Dialog modal={true}>
				<DialogTrigger asChild>
					<Button className="mt-2" variant="secondary">
						<Plus className="size-4" /> Create reminder email
					</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="inline-flex items-center text-lg font-bold">
							<Mail className="mr-1 size-4" /> Reminder Email for This Event
						</DialogTitle>
						<DialogDescription>
							Set up a reminder email for this event. You can configure how many
							hours in advance to send it. Markdown is supported.
						</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<form
							className="flex flex-col gap-4"
							onSubmit={form.handleSubmit(onSubmit)}
						>
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
												(theme === 'dark'
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
											value={field.value?.toString()}
										/>

										<FormMessage />
									</FormItem>
								)}
							/>
							<Button type="submit">Create</Button>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</div>
	)
}
