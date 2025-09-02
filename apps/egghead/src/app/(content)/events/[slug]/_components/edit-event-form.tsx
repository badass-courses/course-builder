'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import type { Event, EventSeries } from '@/lib/events'
import { zodResolver } from '@hookform/resolvers/zod'
import { parseAbsolute } from '@internationalized/date'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
	Button,
	DateTimePicker,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
	useToast,
} from '@coursebuilder/ui'

import { updateEvent } from '../actions'

const EventEditSchema = z.object({
	title: z.string().min(2).max(90),
	description: z.string().optional(),
	body: z.string().optional(),
	startsAt: z.date().nullable().optional(),
	endsAt: z.date().nullable().optional(),
	timezone: z.string().default('America/Los_Angeles'),
	attendeeInstructions: z.string().optional(),
	price: z.number().min(0).nullable().optional(),
	quantity: z.number().min(-1).nullable().optional(),
	state: z.enum(['draft', 'published', 'archived']),
	visibility: z.enum(['public', 'private', 'unlisted']),
})

type EventEditForm = z.infer<typeof EventEditSchema>

interface EditEventFormProps {
	event: Event | EventSeries
}

export function EditEventForm({ event }: EditEventFormProps) {
	const router = useRouter()
	const { toast } = useToast()
	const [isSubmitting, setIsSubmitting] = React.useState(false)

	const form = useForm<EventEditForm>({
		resolver: zodResolver(EventEditSchema),
		defaultValues: {
			title: event.fields.title,
			description: event.fields.description || '',
			body: event.fields.body || '',
			startsAt: event.fields.startsAt ? new Date(event.fields.startsAt) : null,
			endsAt: event.fields.endsAt ? new Date(event.fields.endsAt) : null,
			timezone: event.fields.timezone || 'America/Los_Angeles',
			attendeeInstructions: event.fields.attendeeInstructions || '',
			price: event.fields.price ?? null,
			quantity: event.fields.quantity ?? null,
			state: event.fields.state || 'draft',
			visibility: event.fields.visibility || 'unlisted',
		},
	})

	const onSubmit = async (data: EventEditForm) => {
		setIsSubmitting(true)
		try {
			const result = await updateEvent(event.id, data)

			if (result.success) {
				toast({
					title: 'Event updated',
					description: 'Your changes have been saved successfully.',
				})
				router.push(`/events/${event.fields.slug}`)
			} else {
				toast({
					title: 'Failed to update event',
					description:
						result.error || 'An error occurred while saving your changes.',
					variant: 'destructive',
				})
			}
		} catch (error) {
			console.error(error)
			toast({
				title: 'Error',
				description: 'An unexpected error occurred.',
				variant: 'destructive',
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Event Title</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Short Description</FormLabel>
							<FormControl>
								<Textarea {...field} rows={3} />
							</FormControl>
							<FormDescription>
								A brief description that appears in event listings
							</FormDescription>
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
								<FormLabel>Start Date & Time</FormLabel>
								<FormControl>
									<DateTimePicker
										value={
											field.value
												? parseAbsolute(
														field.value.toISOString(),
														form.watch('timezone'),
													)
												: null
										}
										onChange={(date) => {
											field.onChange(
												date ? date.toDate(form.watch('timezone')) : null,
											)
										}}
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
								<FormLabel>End Date & Time</FormLabel>
								<FormControl>
									<DateTimePicker
										value={
											field.value
												? parseAbsolute(
														field.value.toISOString(),
														form.watch('timezone'),
													)
												: null
										}
										onChange={(date) => {
											field.onChange(
												date ? date.toDate(form.watch('timezone')) : null,
											)
										}}
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
					name="timezone"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Timezone</FormLabel>
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="America/Los_Angeles">
										Pacific Time (PT)
									</SelectItem>
									<SelectItem value="America/Denver">
										Mountain Time (MT)
									</SelectItem>
									<SelectItem value="America/Chicago">
										Central Time (CT)
									</SelectItem>
									<SelectItem value="America/New_York">
										Eastern Time (ET)
									</SelectItem>
									<SelectItem value="UTC">UTC</SelectItem>
									<SelectItem value="Europe/London">London</SelectItem>
									<SelectItem value="Europe/Berlin">Berlin</SelectItem>
									<SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="grid grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="price"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Price</FormLabel>
								<FormControl>
									<Input
										type="number"
										min="0"
										step="0.01"
										{...field}
										value={field.value ?? ''}
										onChange={(e) => {
											const value = e.target.value
											field.onChange(value === '' ? null : parseFloat(value))
										}}
									/>
								</FormControl>
								<FormDescription>Leave empty for free events</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="quantity"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Seats Available</FormLabel>
								<FormControl>
									<Input
										type="number"
										min="-1"
										{...field}
										value={field.value ?? ''}
										onChange={(e) => {
											const value = e.target.value
											field.onChange(value === '' ? null : parseInt(value))
										}}
									/>
								</FormControl>
								<FormDescription>Set to -1 for unlimited</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="body"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Event Details</FormLabel>
							<FormControl>
								<Textarea {...field} rows={10} />
							</FormControl>
							<FormDescription>
								Detailed information about the event (supports Markdown)
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="attendeeInstructions"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Attendee Instructions</FormLabel>
							<FormControl>
								<Textarea {...field} rows={5} />
							</FormControl>
							<FormDescription>
								Instructions that will be shown to registered attendees
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="grid grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="state"
						render={({ field }) => (
							<FormItem>
								<FormLabel>State</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value="draft">Draft</SelectItem>
										<SelectItem value="published">Published</SelectItem>
										<SelectItem value="archived">Archived</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="visibility"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Visibility</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value="public">Public</SelectItem>
										<SelectItem value="unlisted">Unlisted</SelectItem>
										<SelectItem value="private">Private</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="flex justify-end gap-4">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.push(`/events/${event.fields.slug}`)}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? 'Saving...' : 'Save Changes'}
					</Button>
				</div>
			</form>
		</Form>
	)
}
