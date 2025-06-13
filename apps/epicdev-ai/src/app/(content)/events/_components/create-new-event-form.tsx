'use client'

import { useRouter } from 'next/navigation'
import { NewEventSchema, type NewEvent } from '@/lib/events'
import { createEvent } from '@/lib/events-query'
import { api } from '@/trpc/react'
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
import AdvancedTagSelector from '@coursebuilder/ui/resources-crud/tag-selector'

export default function CreateNewEventForm() {
	const form = useForm<NewEvent>({
		resolver: zodResolver(NewEventSchema),
		defaultValues: {
			fields: {
				title: '',
				startsAt: undefined,
				endsAt: undefined,
				price: 250,
				quantity: 40,
				tagIds: undefined,
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
	const { data: tags, isLoading } = api.tags.getTags.useQuery()
	const parsedTagsForUiPackage = z
		.array(
			z.object({
				id: z.string(),
				fields: z.object({
					label: z.string(),
					name: z.string(),
				}),
			}),
		)
		.parse(tags || [])

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
									aria-label="Starts At"
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
									aria-label="Ends At"
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
						name="fields.price"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Price</FormLabel>
								<FormControl>
									<Input
										type="number"
										{...field}
										value={
											field.value === null || field.value === undefined
												? ''
												: String(field.value)
										}
										onChange={(e) => {
											const value = e.target.value
											const parsedValue = parseFloat(value)
											field.onChange(isNaN(parsedValue) ? null : parsedValue)
										}}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="fields.quantity"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Seats available</FormLabel>
								<FormControl>
									<Input
										type="number"
										{...field}
										value={
											field.value === null || field.value === undefined
												? ''
												: String(field.value)
										}
										onChange={(e) => {
											const value = e.target.value
											const parsedValue = parseInt(value)
											field.onChange(isNaN(parsedValue) ? null : parsedValue)
										}}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div>
						<FormLabel>Tags</FormLabel>
						<AdvancedTagSelector
							className="mt-0 space-y-1"
							availableTags={parsedTagsForUiPackage}
							selectedTags={form.watch('fields.tagIds') || []}
							onTagSelect={(tag) => {
								form.setValue('fields.tagIds', [
									...(form.getValues('fields.tagIds') || []),
									tag,
								])
							}}
							onTagRemove={(tagId) => {
								form.setValue(
									'fields.tagIds',
									(form.getValues('fields.tagIds') || []).filter(
										(t) => t.id !== tagId,
									),
								)
							}}
						/>
					</div>
					<Button type="submit" disabled={form.formState.isSubmitting}>
						{form.formState.isSubmitting ? 'Creating...' : 'Create event'}
					</Button>
				</form>
			</Form>
		</div>
	)
}
