'use client'

import { useRouter } from 'next/navigation'
import {
	MultipleEventsSchema,
	multipleEventsToNewEvents,
	type MultipleEvents,
} from '@/lib/events'
import { createMultipleEvents } from '@/lib/events-query'
import { api } from '@/trpc/react'
import { getResourcePath } from '@/utils/resource-paths'
import { zodResolver } from '@hookform/resolvers/zod'
import { parseAbsolute } from '@internationalized/date'
import { PlusCircle } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
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
	const form = useForm<MultipleEvents>({
		resolver: zodResolver(MultipleEventsSchema),
		defaultValues: {
			type: 'event',
			sharedFields: {
				price: 250,
				quantity: 40,
			},
			events: [
				{
					title: '',
					startsAt: undefined,
					endsAt: undefined,
					tagIds: undefined,
				},
			],
		},
	})

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'events',
	})

	const router = useRouter()
	const { toast } = useToast()

	const onSubmit = async (data: MultipleEvents) => {
		try {
			const eventsToCreate = multipleEventsToNewEvents(data)
			const createdEvents = await createMultipleEvents(eventsToCreate)

			if (!createdEvents || createdEvents.length === 0) {
				throw new Error('No events were created')
			}

			toast({
				title: `${createdEvents.length} event${createdEvents.length > 1 ? 's' : ''} created`,
				description: 'Events created successfully',
			})

			// Navigate to the first event's edit page
			const firstEvent = createdEvents[0]
			if (firstEvent?.fields?.slug) {
				router.push(getResourcePath('event', firstEvent.fields.slug, 'edit'))
			}
		} catch (error) {
			console.error(error)
			toast({
				title: 'Failed to create events',
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
					{/* Shared Product Configuration */}
					<div className="border-b pb-4">
						<h3 className="mb-3 text-lg font-semibold">Pricing</h3>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="sharedFields.price"
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
													field.onChange(
														isNaN(parsedValue) ? null : parsedValue,
													)
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="sharedFields.quantity"
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
													field.onChange(
														isNaN(parsedValue) ? null : parsedValue,
													)
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</div>

					{/* Events Section */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold">Events</h3>
							<Button
								type="button"
								variant="outline"
								onClick={() =>
									append({
										title: '',
										startsAt: undefined,
										endsAt: undefined,
										tagIds: undefined,
									})
								}
							>
								<PlusCircle className="mr-2 size-4" /> Add another event
							</Button>
						</div>

						<Accordion
							type="multiple"
							defaultValue={['event-0']}
							className="flex w-full flex-col gap-1"
						>
							{fields.map((field, index) => (
								<AccordionItem
									className="border-0"
									key={field.id}
									value={`event-${index}`}
								>
									<AccordionTrigger className="bg-card w-full justify-between rounded-lg px-3 py-2 text-left [&[data-state=open]]:rounded-b-none">
										<div className="mr-4 flex w-full items-center justify-between">
											<span className="font-semibold">
												{form.watch(`events.${index}.title`) ||
													`Event ${index + 1}`}
											</span>
											{fields.length > 1 && (
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={(e) => {
														e.stopPropagation()
														remove(index)
													}}
												>
													Remove
												</Button>
											)}
										</div>
									</AccordionTrigger>
									<AccordionContent className="space-y-4 rounded-b-lg border p-3 [&[data-state=open]]:rounded-t-none">
										<FormField
											control={form.control}
											name={`events.${index}.title`}
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
											name={`events.${index}.startsAt`}
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
																!!date
																	? date.toDate('America/Los_Angeles')
																	: null,
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
											name={`events.${index}.endsAt`}
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
																!!date
																	? date.toDate('America/Los_Angeles')
																	: null,
															)
														}}
														shouldCloseOnSelect={false}
														granularity="minute"
													/>
													<FormMessage />
												</FormItem>
											)}
										/>
										<div>
											<FormLabel>Tags</FormLabel>
											<AdvancedTagSelector
												className="mt-0 space-y-1"
												availableTags={parsedTagsForUiPackage}
												selectedTags={
													form.watch(`events.${index}.tagIds`) || []
												}
												onTagSelect={(tag) => {
													const currentTags =
														form.getValues(`events.${index}.tagIds`) || []
													form.setValue(`events.${index}.tagIds`, [
														...currentTags,
														tag,
													])
												}}
												onTagRemove={(tagId) => {
													const currentTags =
														form.getValues(`events.${index}.tagIds`) || []
													form.setValue(
														`events.${index}.tagIds`,
														currentTags.filter((t) => t.id !== tagId),
													)
												}}
											/>
										</div>
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					</div>

					<Button
						type="submit"
						disabled={form.formState.isSubmitting}
						size="lg"
					>
						{form.formState.isSubmitting
							? 'Creating...'
							: `Create ${fields.length} Event${fields.length > 1 ? 's' : ''}`}
					</Button>
				</form>
			</Form>
		</div>
	)
}
