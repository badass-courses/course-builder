'use client'

import React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { parseAbsolute } from '@internationalized/date'
import { PlusCircle } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'

import type { ContentResource } from '@coursebuilder/core/schemas/content-resource-schema'

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
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
	Switch,
	useToast,
} from '../index'
import AdvancedTagSelector from '../resources-crud/tag-selector'

export type EventCreationResult = {
	type: 'single' | 'series'
	event?: ContentResource
	eventSeries?: ContentResource
	childEvents?: ContentResource[]
}

export type CreateEventFormProps = {
	onSuccess: (result: EventCreationResult) => Promise<void>
	createEvent: (data: EventFormData) => Promise<ContentResource>
	createEventSeries: (data: EventSeriesFormData) => Promise<{
		eventSeries: ContentResource
		childEvents: ContentResource[]
	}>
	tags?: {
		id: string
		fields: {
			label: string
			name: string
		}
	}[]
	allowMultipleEvents?: boolean
	allowCoupons?: boolean
	defaultTimezone?: string
	defaultPrice?: number
	defaultQuantity?: number
	defaultCouponEnabled?: boolean
	defaultCouponPercentageDiscount?:
		| '1'
		| '0.95'
		| '0.9'
		| '0.75'
		| '0.6'
		| '0.5'
		| '0.4'
		| '0.25'
		| '0.1'
}

/**
 * Schema for creating multiple events with shared product configuration
 * Each event has its own title, dates, and tags, but they share price and quantity
 * When multiple events are created, an event series is created to contain them
 */
export const MultipleEventsFormSchema = z
	.object({
		type: z.enum(['event', 'event-series']).default('event'),
		eventSeries: z.object({
			title: z.string().max(90).default(''),
			description: z.string().optional(),
			tagIds: z
				.array(
					z.object({
						id: z.string(),
						fields: z.object({
							label: z.string(),
							name: z.string(),
						}),
					}),
				)
				.nullish(),
		}),
		sharedFields: z.object({
			price: z.number().min(0).nullish(),
			quantity: z.number().min(-1).nullish(),
		}),
		coupon: z.object({
			enabled: z.boolean().default(false),
			percentageDiscount: z
				.enum(['1', '0.95', '0.9', '0.75', '0.6', '0.5', '0.4', '0.25', '0.1'])
				.optional(),
			expires: z.date().optional(),
		}),
		events: z
			.array(
				z.object({
					title: z.string().min(2).max(90),
					startsAt: z.date().nullish(),
					endsAt: z.date().nullish(),
					location: z.string().optional(),
					tagIds: z
						.array(
							z.object({
								id: z.string(),
								fields: z.object({
									label: z.string(),
									name: z.string(),
								}),
							}),
						)
						.nullish(), // Tags are per-event, not shared
				}),
			)
			.min(1),
	})
	.refine(
		(data) => {
			// Require series title if more than one event
			if (data.events.length > 1 && data.eventSeries.title.trim().length < 2) {
				return false
			}
			return true
		},
		{
			message: 'Series title must be at least 2 characters',
			path: ['eventSeries', 'title'],
		},
	)
	.refine(
		(data) => {
			// Require percentage discount when coupon is enabled
			if (data.coupon.enabled && !data.coupon.percentageDiscount) {
				return false
			}
			return true
		},
		{
			message: 'Percentage discount is required',
			path: ['coupon', 'percentageDiscount'],
		},
	)
	.refine(
		(data) => {
			// Require expiration date when coupon is enabled
			if (data.coupon.enabled && !data.coupon.expires) {
				return false
			}
			return true
		},
		{
			message: 'Expiration date is required',
			path: ['coupon', 'expires'],
		},
	)

export type MultipleEventsForm = z.infer<typeof MultipleEventsFormSchema>

/**
 * Schema for adapter-level single event creation
 * Includes database fields required by the adapter
 */
export const EventFormDataSchema = z.object({
	type: z.literal('event'),
	fields: z.object({
		title: z.string().min(2).max(90),
		startsAt: z.date().nullish(),
		endsAt: z.date().nullish(),
		description: z.string().optional(),
		location: z.string().optional(),
		price: z.number().min(0).nullish(),
		quantity: z.number().min(-1).nullish(),
		state: z.string().optional(),
		visibility: z.string().optional(),
		slug: z.string().optional(),
		tagIds: z
			.array(
				z.object({
					id: z.string(),
					fields: z.object({
						label: z.string(),
						name: z.string(),
					}),
				}),
			)
			.nullish(),
	}),
	coupon: z
		.object({
			enabled: z.boolean(),
			percentageDiscount: z.string().optional(),
			expires: z.date().optional(),
		})
		.optional(),
})

export type EventFormData = z.infer<typeof EventFormDataSchema>

/**
 * Schema for adapter-level event series creation
 * Includes database fields required by the adapter
 */
export const EventSeriesFormDataSchema = z.object({
	type: z.literal('event-series'),
	eventSeries: z.object({
		title: z.string().min(2).max(90),
		description: z.string().optional(),
		tagIds: z
			.array(
				z.object({
					id: z.string(),
					fields: z.object({
						label: z.string(),
						name: z.string(),
					}),
				}),
			)
			.nullish(),
	}),
	sharedFields: z.object({
		price: z.number().min(0).nullish(),
		quantity: z.number().min(-1).nullish(),
	}),
	childEvents: z
		.array(
			z.object({
				type: z.literal('event'),
				fields: z.object({
					title: z.string().min(2).max(90),
					startsAt: z.date().nullish(),
					endsAt: z.date().nullish(),
					description: z.string().optional(),
					location: z.string().optional(),
					tagIds: z
						.array(
							z.object({
								id: z.string(),
								fields: z.object({
									label: z.string(),
									name: z.string(),
								}),
							}),
						)
						.nullish(),
				}),
			}),
		)
		.min(1),
	coupon: z
		.object({
			enabled: z.boolean(),
			percentageDiscount: z.string().optional(),
			expires: z.date().optional(),
		})
		.optional(),
})

export type EventSeriesFormData = z.infer<typeof EventSeriesFormDataSchema>

/**
 * Shared event creation form component that can be used across multiple apps
 * Uses function props pattern for all external dependencies
 */
export function CreateEventForm({
	tags,
	onSuccess,
	createEvent,
	createEventSeries,
	allowMultipleEvents = true,
	allowCoupons = true,
	defaultTimezone = 'America/Los_Angeles',
	defaultPrice = 250,
	defaultQuantity = 40,
	defaultCouponEnabled = false,
	defaultCouponPercentageDiscount = '0.25',
}: CreateEventFormProps) {
	const form = useForm<MultipleEventsForm>({
		resolver: zodResolver(MultipleEventsFormSchema),
		defaultValues: {
			type: 'event',
			eventSeries: {
				title: '',
				description: '',
				tagIds: undefined,
			},
			sharedFields: {
				price: defaultPrice,
				quantity: defaultQuantity,
			},
			coupon: {
				enabled: defaultCouponEnabled,
				percentageDiscount: defaultCouponPercentageDiscount,
				expires: undefined,
			},
			events: [
				{
					title: '',
					startsAt: undefined,
					endsAt: undefined,
					location: undefined,
					tagIds: undefined,
				},
			],
		},
	})

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'events',
	})

	const { toast } = useToast()

	const onSubmit = async (data: MultipleEventsForm) => {
		try {
			if (data.events.length === 1 && !data.eventSeries.title.trim()) {
				// Single event - transform to adapter format (app wrapper adds system fields)
				const firstEvent = data.events[0]
				if (!firstEvent) {
					throw new Error('Event data is required')
				}

				const singleEventData: Omit<
					EventFormData,
					'createdById' | 'organizationId'
				> = {
					type: 'event',
					fields: {
						title: firstEvent.title,
						startsAt: firstEvent.startsAt,
						endsAt: firstEvent.endsAt,
						location: firstEvent.location,
						price: data.sharedFields.price,
						quantity: data.sharedFields.quantity,
						tagIds: firstEvent.tagIds,
					},
					coupon: data.coupon,
				}

				const event = await createEvent(singleEventData)

				await onSuccess({
					type: 'single',
					event,
				})

				toast({
					title: 'Event created',
					description: data.coupon.enabled
						? 'Event and discount coupon created successfully'
						: 'Event created successfully',
				})
			} else {
				// Multiple events or event series - transform to adapter format
				const eventSeriesData: Omit<
					EventSeriesFormData,
					'createdById' | 'organizationId'
				> = {
					type: 'event-series',
					eventSeries: data.eventSeries,
					sharedFields: data.sharedFields,
					coupon: data.coupon,
					childEvents: data.events.map((event) => ({
						type: 'event' as const,
						fields: {
							title: event.title,
							startsAt: event.startsAt,
							endsAt: event.endsAt,
							location: event.location,
							tagIds: event.tagIds,
						},
					})),
				}

				const result = await createEventSeries(eventSeriesData)

				await onSuccess({
					type: 'series',
					eventSeries: result.eventSeries,
					childEvents: result.childEvents,
				})

				toast({
					title: `Event series created with ${result.childEvents?.length || 0} event${(result.childEvents?.length || 0) > 1 ? 's' : ''}`,
					description: data.coupon.enabled
						? 'Event series and discount coupon created successfully'
						: 'Event series created successfully',
				})
			}
		} catch (error) {
			console.error(error)
			toast({
				title: 'Failed to create events',
				description: error instanceof Error ? error.message : 'Unknown error',
				variant: 'destructive',
			})
		}
	}

	return (
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
											min="0"
											step="0.01"
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
							name="sharedFields.quantity"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Seats available</FormLabel>
									<FormControl>
										<Input
											type="number"
											min="-1"
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
									<FormDescription>
										Set to -1 for unlimited seats
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</div>

				{/* Discount Coupon Section */}
				{allowCoupons &&
					form.watch('sharedFields.price') &&
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
													<FormControl>
														<DateTimePicker
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
															granularity="day"
														/>
													</FormControl>
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
						{allowMultipleEvents && (
							<Button
								type="button"
								variant="outline"
								onClick={() =>
									append({
										title: '',
										startsAt: undefined,
										endsAt: undefined,
										location: undefined,
										tagIds: undefined,
									})
								}
							>
								<PlusCircle className="mr-2 size-4" /> Add another event
							</Button>
						)}
					</div>

					{/* Event Series Section (only show if multiple events) */}
					{allowMultipleEvents && form.watch('events').length > 1 && (
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
										availableTags={tags || []}
										selectedTags={form.watch('eventSeries.tagIds') || []}
										onTagSelect={(tag) => {
											const currentTags =
												form.getValues('eventSeries.tagIds') || []
											form.setValue('eventSeries.tagIds', [...currentTags, tag])
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

					{/* Individual Events */}
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
										{allowMultipleEvents && fields.length > 1 && (
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
								<AccordionContent className="bg-muted/50 space-y-4 rounded-lg border p-3">
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

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name={`events.${index}.startsAt`}
											render={({ field }) => (
												<FormItem>
													<FormLabel>Starts at</FormLabel>
													<FormControl>
														<DateTimePicker
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
															granularity="minute"
														/>
													</FormControl>
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
													<FormControl>
														<DateTimePicker
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
										name={`events.${index}.location`}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Location</FormLabel>
												<FormControl>
													<Input
														{...field}
														placeholder="Zoom link or physical address"
														value={field.value || ''}
													/>
												</FormControl>
												<FormDescription>
													Meeting link (e.g., Zoom URL) or physical location
												</FormDescription>
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
											availableTags={tags || []}
											selectedTags={form.watch(`events.${index}.tagIds`) || []}
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

				<Button type="submit" disabled={form.formState.isSubmitting} size="lg">
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
	)
}
