'use client'

import * as React from 'react'
import { Cohort, OfficeHourEvent } from '@/lib/cohort'
import { zodResolver } from '@hookform/resolvers/zod'
import { parseAbsolute } from '@internationalized/date'
import { format } from 'date-fns'
import { Clock, Plus, Trash } from 'lucide-react'
import { useForm, UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import {
	Button,
	DateTimePicker,
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
	createOfficeHourEventsAction,
	deleteOfficeHourEventAction,
	updateOfficeHourEventAction,
} from '../actions'

// Schema for the office hour form
const OfficeHourFormSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	startsAt: z.string().datetime(),
	endsAt: z.string().datetime(),
	description: z.string().optional(),
	attendeeInstructions: z.string().optional(),
})

type OfficeHourForm = z.infer<typeof OfficeHourFormSchema>

interface OfficeHoursFieldProps {
	form: UseFormReturn<Cohort>
	cohort: Cohort
}

export function OfficeHoursField({ form, cohort }: OfficeHoursFieldProps) {
	const [isCreating, setIsCreating] = React.useState(false)
	const [editingEvent, setEditingEvent] =
		React.useState<OfficeHourEvent | null>(null)

	const events = cohort.fields.officeHours?.events || []

	const createOfficeHourForm = useForm<OfficeHourForm>({
		resolver: zodResolver(OfficeHourFormSchema),
		defaultValues: {
			title: '',
			startsAt: '',
			endsAt: '',
			description: '',
			attendeeInstructions: '',
		},
	})

	const handleCreateOfficeHour = async (data: OfficeHourForm) => {
		setIsCreating(true)
		try {
			const newEvent: OfficeHourEvent = {
				id: `office-hours-${Date.now()}`,
				title: data.title,
				startsAt: data.startsAt,
				endsAt: data.endsAt,
				description: data.description,
				attendeeInstructions: data.attendeeInstructions,
				status: 'scheduled',
			}

			const result = await createOfficeHourEventsAction(cohort.id, [newEvent])

			if (result.success) {
				// Update form with new event
				const updatedEvents = [...events, newEvent]
				form.setValue('fields.officeHours.events', updatedEvents)
				form.setValue('fields.officeHours.enabled', true)

				// Reset the create form
				createOfficeHourForm.reset()
			} else {
				console.error('Failed to create office hour:', result.error)
			}
		} catch (error) {
			console.error('Error creating office hour:', error)
		} finally {
			setIsCreating(false)
		}
	}

	const handleDeleteEvent = async (eventId: string) => {
		try {
			const result = await deleteOfficeHourEventAction(cohort.id, eventId)

			if (result.success) {
				const updatedEvents = events.filter((event) => event.id !== eventId)
				form.setValue('fields.officeHours.events', updatedEvents)
			} else {
				console.error('Failed to delete office hour event:', result.error)
			}
		} catch (error) {
			console.error('Error deleting office hour:', error)
		}
	}

	return (
		<div className="px-5">
			<div className="mb-2 text-lg font-semibold">Office Hours</div>
			<ul className="flex flex-col gap-2">
				{events.map((event) => (
					<OfficeHourItem
						key={event.id}
						event={event}
						cohortId={cohort.id}
						onDelete={() => handleDeleteEvent(event.id)}
						onEdit={setEditingEvent}
					/>
				))}
			</ul>

			<Dialog modal={true}>
				<DialogTrigger asChild>
					<Button className="mt-2" variant="secondary">
						<Plus className="size-4" /> Add Office Hours
					</Button>
				</DialogTrigger>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle className="inline-flex items-center text-lg font-semibold">
							<Clock className="mr-1 size-4" /> Schedule Office Hours
						</DialogTitle>
						<DialogDescription>
							Schedule office hours for cohort participants. Times are in
							Pacific timezone.
						</DialogDescription>
					</DialogHeader>
					<CreateOfficeHourForm
						form={createOfficeHourForm}
						onSubmit={handleCreateOfficeHour}
						isCreating={isCreating}
					/>
				</DialogContent>
			</Dialog>
		</div>
	)
}

function OfficeHourItem({
	event,
	cohortId,
	onDelete,
	onEdit,
}: {
	event: OfficeHourEvent
	cohortId: string
	onDelete: () => void
	onEdit: (event: OfficeHourEvent) => void
}) {
	const startDate = new Date(event.startsAt)
	const endDate = new Date(event.endsAt)
	const duration = Math.round(
		(endDate.getTime() - startDate.getTime()) / (1000 * 60),
	)

	return (
		<li className="border-primary/50 bg-card/50 flex items-center justify-between gap-2 rounded-md border px-3 py-2 shadow-sm">
			<Dialog modal={true}>
				<DialogTrigger>
					<div className="flex flex-col items-start">
						<span className="text-primary inline-flex cursor-pointer items-center gap-2 text-left font-semibold transition-colors hover:underline">
							{event.title}
						</span>
						<div className="flex flex-col text-left">
							<span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
								{format(startDate, 'MMM d, yyyy')} at{' '}
								{format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')} PT
							</span>
							<span className="text-muted-foreground text-sm">
								{duration} minutes
							</span>
						</div>
					</div>
				</DialogTrigger>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle className="inline-flex items-center text-lg font-semibold">
							<Clock className="mr-1 size-4" /> {event.title}
						</DialogTitle>
						<DialogDescription>
							Edit this office hours session.
						</DialogDescription>
					</DialogHeader>
					<EditOfficeHourForm event={event} cohortId={cohortId} />
				</DialogContent>
			</Dialog>
			<div className="flex items-center gap-2">
				<Button size="sm" variant="outline" type="button" onClick={onDelete}>
					<Trash className="size-4" />
				</Button>
			</div>
		</li>
	)
}

function CreateOfficeHourForm({
	form,
	onSubmit,
	isCreating,
}: {
	form: UseFormReturn<OfficeHourForm>
	onSubmit: (data: OfficeHourForm) => void
	isCreating: boolean
}) {
	// Set smart defaults
	React.useEffect(() => {
		const now = new Date()
		const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
		const startTime = new Date(nextWeek)
		startTime.setHours(14, 0, 0, 0) // 2 PM Pacific

		const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour later

		form.setValue('startsAt', startTime.toISOString())
		form.setValue('endsAt', endTime.toISOString())
		form.setValue('title', `Office Hours - ${format(startTime, 'MMM d, yyyy')}`)
	}, [form])

	const watchedStartsAt = form.watch('startsAt')

	// Auto-update end time when start time changes
	React.useEffect(() => {
		if (watchedStartsAt) {
			const startDate = new Date(watchedStartsAt)
			const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 1 hour later
			form.setValue('endsAt', endDate.toISOString())
		}
	}, [watchedStartsAt, form])

	return (
		<Form {...form}>
			<form className="flex flex-col gap-4">
				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Title</FormLabel>
							<FormControl>
								<Input {...field} placeholder="Office Hours - MMM d, yyyy" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="grid grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="startsAt"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Starts At (PT)</FormLabel>
								<FormControl>
									<DateTimePicker
										{...field}
										value={
											field.value
												? parseAbsolute(
														new Date(field.value).toISOString(),
														'America/Los_Angeles',
													)
												: null
										}
										onChange={(date) => {
											field.onChange(
												date
													? date.toDate('America/Los_Angeles').toISOString()
													: '',
											)
										}}
										shouldCloseOnSelect={false}
										granularity="minute"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="endsAt"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Ends At (PT)</FormLabel>
								<FormControl>
									<DateTimePicker
										{...field}
										value={
											field.value
												? parseAbsolute(
														new Date(field.value).toISOString(),
														'America/Los_Angeles',
													)
												: null
										}
										onChange={(date) => {
											field.onChange(
												date
													? date.toDate('America/Los_Angeles').toISOString()
													: '',
											)
										}}
										shouldCloseOnSelect={false}
										granularity="minute"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Description (optional)</FormLabel>
							<FormControl>
								<Textarea
									{...field}
									placeholder="Brief description of what will be covered..."
									rows={3}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="attendeeInstructions"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Instructions for Attendees (optional)</FormLabel>
							<FormControl>
								<Textarea
									{...field}
									placeholder="Meeting link, preparation instructions, etc..."
									rows={3}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<DialogFooter>
					<DialogTrigger asChild>
						<Button
							type="button"
							onClick={() => form.handleSubmit(onSubmit)()}
							disabled={isCreating}
						>
							{isCreating ? 'Creating...' : 'Create Office Hours'}
						</Button>
					</DialogTrigger>
				</DialogFooter>
			</form>
		</Form>
	)
}

function EditOfficeHourForm({
	event,
	cohortId,
}: {
	event: OfficeHourEvent
	cohortId: string
}) {
	// This would be similar to CreateOfficeHourForm but pre-populated with event data
	// For now, just show the event details
	return (
		<div className="space-y-4">
			<div>
				<strong>Title:</strong> {event.title}
			</div>
			<div>
				<strong>Time:</strong>{' '}
				{format(new Date(event.startsAt), 'MMM d, yyyy h:mm a')} -{' '}
				{format(new Date(event.endsAt), 'h:mm a')} PT
			</div>
			{event.description && (
				<div>
					<strong>Description:</strong> {event.description}
				</div>
			)}
			{event.attendeeInstructions && (
				<div>
					<strong>Instructions:</strong> {event.attendeeInstructions}
				</div>
			)}
			<p className="text-muted-foreground text-sm">
				Edit functionality coming soon...
			</p>
		</div>
	)
}
