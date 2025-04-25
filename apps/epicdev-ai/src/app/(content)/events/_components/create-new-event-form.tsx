'use client'

import { useRouter } from 'next/navigation'
import { NewEventSchema, type NewEvent } from '@/lib/events'
import { createEvent } from '@/lib/events-query'
import { getResourcePath } from '@/utils/resource-paths'
import { zodResolver } from '@hookform/resolvers/zod'
import { parseAbsolute } from '@internationalized/date'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
	Button,
	DateTimePicker,
	DialogFooter,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	useToast,
} from '@coursebuilder/ui'

export default function CreateNewEventForm() {
	const form = useForm<NewEvent>({
		resolver: zodResolver(NewEventSchema),
		defaultValues: {
			fields: {
				title: '',
				startsAt: undefined,
				endsAt: undefined,
			},
		},
	})
	const router = useRouter()
	const { toast } = useToast()
	const onSubmit = async (data: NewEvent) => {
		try {
			const event = await createEvent(data)
			if (!event?.fields?.slug) {
				throw new Error('Event slug is required')
			}

			toast({
				title: 'Event created',
				description: 'Event created successfully',
			})
			router.push(getResourcePath('event', event.fields.slug, 'edit'))
		} catch (error) {
			console.error(error)
			toast({
				title: 'Failed to create event',
				description: error instanceof Error ? error.message : 'Unknown error',
			})
		}
	}

	return (
		<div>
			<Form {...form}>
				<form
					className="flex flex-col space-y-4"
					onSubmit={form.handleSubmit(onSubmit, (error) => {
						console.error(error)
					})}
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
						name="fields.startsAt"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Starts at</FormLabel>
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
							<FormItem>
								<FormLabel>Ends at</FormLabel>
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
					<Button type="submit" disabled={form.formState.isSubmitting}>
						{form.formState.isSubmitting ? 'Creating...' : 'Create event'}
					</Button>
				</form>
			</Form>
		</div>
	)
}
