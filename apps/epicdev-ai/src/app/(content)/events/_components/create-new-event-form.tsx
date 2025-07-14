'use client'

import { useRouter } from 'next/navigation'
import { MultipleEventsSchema, type MultipleEvents } from '@/lib/events'
import { createEventSeries } from '@/lib/events-query'
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
	useToast,
} from '@coursebuilder/ui'
import AdvancedTagSelector from '@coursebuilder/ui/resources-crud/tag-selector'

export default function CreateNewEventForm() {
	const form = useForm<MultipleEvents>({
		resolver: zodResolver(MultipleEventsSchema),
		defaultValues: {
			type: 'event',
			eventSeries: {
				title: '',
				description: '',
				tagIds: undefined,
			},
			sharedFields: {
				price: 250,
				quantity: 40,
			},
			coupon: {
				enabled: false,
				percentageDiscount: undefined,
				expires: undefined,
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
			if (data.events.length === 1 && !data.eventSeries.title.trim()) {
				// Single event creation - use existing logic with createEvent
				const { createEvent } = await import('@/lib/events-query')
				const firstEvent = data.events[0]
				if (!firstEvent) {
					throw new Error('Event data is required')
				}

				const singleEventData = {
					type: 'event' as const,
					fields: {
						title: firstEvent.title,
						startsAt: firstEvent.startsAt,
						endsAt: firstEvent.endsAt,
						price: data.sharedFields.price,
						quantity: data.sharedFields.quantity,
						tagIds: firstEvent.tagIds,
					},
					coupon: data.coupon,
				}
				const event = await createEvent(singleEventData)

				if (!event?.fields?.slug) {
					throw new Error('Event slug is required')
				}

				toast({
					title: 'Event created',
					description: data.coupon.enabled
						? 'Event and discount coupon created successfully'
						: 'Event created successfully',
				})

				router.push(getResourcePath('event', event.fields.slug, 'edit'))
			} else {
				// Multiple events or event series specified - use new logic
				const result = await createEventSeries(data)

				if (!result.eventSeries || !result.childEvents.length) {
					throw new Error('Failed to create event series')
				}

				toast({
					title: `Event series created with ${result.childEvents.length} event${result.childEvents.length > 1 ? 's' : ''}`,
					description: data.coupon.enabled
						? 'Event series and discount coupon created successfully'
						: 'Event series created successfully',
				})

				// Navigate to the event series edit page
				if (result.eventSeries.fields?.slug) {
					router.push(
						getResourcePath(
							'event-series',
							result.eventSeries.fields.slug,
							'edit',
						),
					)
				}
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

					{/* Discount Coupon Section */}
					{form.watch('sharedFields.price') &&
						form.watch('sharedFields.price')! > 0 && (
							<div className="border-b pb-4">
								<h3 className="mb-3 text-lg font-semibold">Discount Coupon</h3>
								<div className="space-y-4">
									<FormField
										control={form.control}
										name="coupon.enabled"
										render={({ field }) => (
											<FormItem className="flex flex-row items-center justify-between">
												<div className="space-y-0.5">
													<FormLabel>Create discount coupon</FormLabel>
													<FormDescription>
														Auto-apply coupon restricted to this event/series
													</FormDescription>
												</div>
												<FormControl>
													<Switch
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
											</FormItem>
										)}
									/>
									{form.watch('coupon.enabled') && (
										<div className="grid grid-cols-2 gap-4">
											<FormField
												control={form.control}
												name="coupon.percentageDiscount"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Discount percentage</FormLabel>
														<Select
															onValueChange={field.onChange}
															value={field.value}
															defaultValue="0.25"
														>
															<FormControl>
																<SelectTrigger>
																	<SelectValue placeholder="Select discount" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value="0.1">10% off</SelectItem>
																<SelectItem value="0.25">25% off</SelectItem>
																<SelectItem value="0.4">40% off</SelectItem>
																<SelectItem value="0.5">50% off</SelectItem>
																<SelectItem value="0.6">60% off</SelectItem>
																<SelectItem value="0.75">75% off</SelectItem>
																<SelectItem value="0.9">90% off</SelectItem>
																<SelectItem value="0.95">95% off</SelectItem>
															</SelectContent>
														</Select>
														<FormDescription>
															{(() => {
																const originalPrice =
																	form.watch('sharedFields.price')
																const discountPercentage = form.watch(
																	'coupon.percentageDiscount',
																)

																if (originalPrice && discountPercentage) {
																	const finalPrice =
																		originalPrice *
																		(1 - Number(discountPercentage))
																	return `Final price: $${finalPrice.toFixed(2)}`
																}
																return 'Choose discount amount'
															})()}
														</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="coupon.expires"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Expiration date</FormLabel>
														<DateTimePicker
															{...field}
															aria-label="Coupon Expires At"
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
															granularity="day"
														/>
														<FormDescription>
															Expires at 23:59:59 PT on the selected date
														</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									)}
								</div>
							</div>
						)}

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
						{/* Wrapper Event Configuration - Only show for multiple events */}
						{fields.length > 1 && (
							<div className="bg-card rounded-lg border p-4">
								<h3 className="text-lg font-semibold">
									Event Series Information
								</h3>
								<FormDescription>
									This will be used to present the series to the user.
								</FormDescription>
								<div className="mt-1 space-y-2">
									<FormField
										control={form.control}
										name="eventSeries.title"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Series Title (required)</FormLabel>
												{/* <FormDescription>
												The main title for this event series
											</FormDescription> */}
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="eventSeries.description"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Series Description</FormLabel>
												<FormControl>
													<textarea
														{...field}
														className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
														rows={3}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<div>
										<FormLabel>Series Tags</FormLabel>
										<AdvancedTagSelector
											className="mt-0 space-y-1"
											availableTags={parsedTagsForUiPackage}
											selectedTags={form.watch('eventSeries.tagIds') || []}
											onTagSelect={(tag) => {
												const currentTags =
													form.getValues('eventSeries.tagIds') || []
												form.setValue('eventSeries.tagIds', [
													...currentTags,
													tag,
												])
											}}
											onTagRemove={(tagId) => {
												const currentTags =
													form.getValues('eventSeries.tagIds') || []
												form.setValue(
													'eventSeries.tagIds',
													currentTags.filter((t) => t.id !== tagId),
												)
											}}
										/>
									</div>
								</div>
							</div>
						)}
						{/* Events Section */}
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
									<AccordionTrigger className="bg-card w-full justify-between rounded-lg border px-3 py-2 text-left data-[state=open]:rounded-b-none data-[state=open]:border-b-0">
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
									<AccordionContent className="space-y-4 rounded-b-lg border p-3 data-[state=open]:rounded-t-none">
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
											<FormLabel>Event Tags</FormLabel>
											<FormDescription className="mb-2">
												Tags specific to this individual event
											</FormDescription>
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
							: (() => {
									const isSingleEvent =
										fields.length === 1 &&
										!form.watch('eventSeries.title')?.trim()
									const hasCoupon = form.watch('coupon.enabled')
									const baseText = isSingleEvent
										? 'Create Event'
										: `Create Event Series (${fields.length} Event${fields.length > 1 ? 's' : ''})`
									return hasCoupon ? `${baseText} + Coupon` : baseText
								})()}
					</Button>
				</form>
			</Form>
		</div>
	)
}
