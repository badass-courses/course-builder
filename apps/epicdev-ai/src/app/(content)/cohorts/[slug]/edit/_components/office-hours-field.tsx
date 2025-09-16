'use client'

import * as React from 'react'
import { Cohort, OfficeHourEvent } from '@/lib/cohort'
import { zodResolver } from '@hookform/resolvers/zod'
import { parseAbsolute } from '@internationalized/date'
import { format } from 'date-fns'
import { Clock, Edit2, Plus, Trash, X } from 'lucide-react'
import { useForm, UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import {
	Button,
	Card,
	CardContent,
	DateTimePicker,
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
	const [showCreateForm, setShowCreateForm] = React.useState(false)
	const [editingEventId, setEditingEventId] = React.useState<string | null>(
		null,
	)

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

	// Set smart defaults when showing create form
	React.useEffect(() => {
		if (showCreateForm) {
			const now = new Date()
			const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
			const startTime = new Date(nextWeek)
			startTime.setHours(14, 0, 0, 0) // 2 PM Pacific

			const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour later

			createOfficeHourForm.setValue('startsAt', startTime.toISOString())
			createOfficeHourForm.setValue('endsAt', endTime.toISOString())
			createOfficeHourForm.setValue(
				'title',
				`Office Hours - ${format(startTime, 'MMM d, yyyy')}`,
			)
		}
	}, [showCreateForm, createOfficeHourForm])

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

				// Reset the create form and hide it
				createOfficeHourForm.reset()
				setShowCreateForm(false)
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

	const handleCancelCreate = () => {
		setShowCreateForm(false)
		createOfficeHourForm.reset()
	}

	return (
		<div className="px-5">
			<div className="mb-4 flex items-center justify-between">
				<h2 className="text-lg font-semibold">Office Hours</h2>
				{!showCreateForm && (
					<Button
						variant="secondary"
						size="sm"
						onClick={() => setShowCreateForm(true)}
					>
						<Plus className="mr-1 size-4" /> Add Office Hours
					</Button>
				)}
			</div>

			<div className="space-y-3">
				{/* Create Form - Inline */}
				{showCreateForm && (
					<Card className="border-primary/30 bg-card/50">
						<CardContent className="pt-6">
							<div className="mb-4 flex items-center justify-between">
								<h3 className="flex items-center text-base font-semibold">
									<Clock className="mr-2 size-4" />
									Schedule New Office Hours
								</h3>
								<Button variant="ghost" size="sm" onClick={handleCancelCreate}>
									<X className="size-4" />
								</Button>
							</div>

							<CreateOfficeHourForm
								form={createOfficeHourForm}
								onSubmit={handleCreateOfficeHour}
								onCancel={handleCancelCreate}
								isCreating={isCreating}
							/>
						</CardContent>
					</Card>
				)}

				{/* Existing Events List */}
				{events.map((event) => (
					<OfficeHourItem
						key={event.id}
						event={event}
						onDelete={() => handleDeleteEvent(event.id)}
						isEditing={editingEventId === event.id}
						onEditToggle={() =>
							setEditingEventId(editingEventId === event.id ? null : event.id)
						}
					/>
				))}

				{events.length === 0 && !showCreateForm && (
					<p className="text-muted-foreground text-sm">
						No office hours scheduled yet.
					</p>
				)}
			</div>
		</div>
	)
}

function OfficeHourItem({
	event,
	onDelete,
	isEditing,
	onEditToggle,
}: {
	event: OfficeHourEvent
	onDelete: () => void
	isEditing: boolean
	onEditToggle: () => void
}) {
	const startDate = new Date(event.startsAt)
	const endDate = new Date(event.endsAt)
	const duration = Math.round(
		(endDate.getTime() - startDate.getTime()) / (1000 * 60),
	)

	return (
		<Card className={isEditing ? 'border-primary' : ''}>
			<CardContent className="pt-6">
				{!isEditing ? (
					<div>
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<h3 className="font-semibold">{event.title}</h3>
								<div className="text-muted-foreground mt-1 space-y-1 text-sm">
									<p>
										{format(startDate, 'MMM d, yyyy')} at{' '}
										{format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}{' '}
										PT
									</p>
									<p>{duration} minutes</p>
								</div>
								{event.description && (
									<p className="mt-2 text-sm">{event.description}</p>
								)}
								{event.attendeeInstructions && (
									<div className="mt-2">
										<p className="text-muted-foreground text-xs font-medium">
											Instructions:
										</p>
										<p className="text-sm">{event.attendeeInstructions}</p>
									</div>
								)}
							</div>
							<div className="flex items-center gap-2">
								<Button size="sm" variant="ghost" onClick={onEditToggle}>
									<Edit2 className="size-4" />
								</Button>
								<Button size="sm" variant="ghost" onClick={onDelete}>
									<Trash className="size-4" />
								</Button>
							</div>
						</div>
					</div>
				) : (
					<EditOfficeHourForm
						event={event}
						onCancel={onEditToggle}
						onSuccess={onEditToggle}
					/>
				)}
			</CardContent>
		</Card>
	)
}

function CreateOfficeHourForm({
	form,
	onSubmit,
	onCancel,
	isCreating,
}: {
	form: UseFormReturn<OfficeHourForm>
	onSubmit: (data: OfficeHourForm) => void
	onCancel: () => void
	isCreating: boolean
}) {
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
			<div className="space-y-4">
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

				<div className="flex flex-col gap-4 sm:flex-row sm:gap-4">
					<FormField
						control={form.control}
						name="startsAt"
						render={({ field }) => (
							<FormItem className="min-w-0 flex-1">
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
							<FormItem className="min-w-0 flex-1">
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

				<div className="flex justify-end gap-2">
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
					<Button
						type="button"
						disabled={isCreating}
						onClick={() => form.handleSubmit(onSubmit)()}
					>
						{isCreating ? 'Creating...' : 'Create Office Hours'}
					</Button>
				</div>
			</div>
		</Form>
	)
}

function EditOfficeHourForm({
	event,
	onCancel,
	onSuccess,
}: {
	event: OfficeHourEvent
	onCancel: () => void
	onSuccess: () => void
}) {
	const [isUpdating, setIsUpdating] = React.useState(false)

	const editForm = useForm<OfficeHourForm>({
		resolver: zodResolver(OfficeHourFormSchema),
		defaultValues: {
			title: event.title,
			startsAt: event.startsAt,
			endsAt: event.endsAt,
			description: event.description || '',
			attendeeInstructions: event.attendeeInstructions || '',
		},
	})

	const watchedStartsAt = editForm.watch('startsAt')

	// Auto-update end time when start time changes
	React.useEffect(() => {
		if (watchedStartsAt) {
			const originalDuration =
				new Date(event.endsAt).getTime() - new Date(event.startsAt).getTime()
			const startDate = new Date(watchedStartsAt)
			const endDate = new Date(startDate.getTime() + originalDuration)
			editForm.setValue('endsAt', endDate.toISOString())
		}
	}, [watchedStartsAt, editForm, event.startsAt, event.endsAt])

	const handleUpdateOfficeHour = async (data: OfficeHourForm) => {
		setIsUpdating(true)
		try {
			const result = await updateOfficeHourEventAction(event.id, {
				title: data.title,
				startsAt: data.startsAt,
				endsAt: data.endsAt,
				description: data.description,
				attendeeInstructions: data.attendeeInstructions,
			})

			if (result.success) {
				onSuccess()
				// Force page reload to refresh data
				window.location.reload()
			} else {
				console.error('Failed to update office hour:', result.error)
			}
		} catch (error) {
			console.error('Error updating office hour:', error)
		} finally {
			setIsUpdating(false)
		}
	}

	return (
		<Form {...editForm}>
			<div className="space-y-4">
				<FormField
					control={editForm.control}
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

				<div className="flex flex-col gap-4 sm:flex-row sm:gap-4">
					<FormField
						control={editForm.control}
						name="startsAt"
						render={({ field }) => (
							<FormItem className="min-w-0 flex-1">
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
						control={editForm.control}
						name="endsAt"
						render={({ field }) => (
							<FormItem className="min-w-0 flex-1">
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
					control={editForm.control}
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
					control={editForm.control}
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

				<div className="flex justify-end gap-2">
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
					<Button
						type="button"
						disabled={isUpdating}
						onClick={() => editForm.handleSubmit(handleUpdateOfficeHour)()}
					>
						{isUpdating ? 'Updating...' : 'Update Office Hours'}
					</Button>
				</div>
			</div>
		</Form>
	)
}
