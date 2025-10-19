'use client'

import React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { parseAbsolute } from '@internationalized/date'
import { Calendar } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { ContentResource } from '@coursebuilder/core/schemas/content-resource-schema'

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
	Switch,
	useToast,
} from '../index'
import { WorkshopSelector, type WorkshopOption } from './workshop-selector'

/**
 * Schema for cohort creation form
 */
export const CohortFormDataSchema = z.object({
	cohort: z.object({
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
	dates: z.object({
		start: z.date(),
		end: z.date(),
	}),
	createProduct: z.boolean().default(false),
	pricing: z.object({
		price: z.number().min(0).nullish(),
	}),
	coupon: z.object({
		enabled: z.boolean().default(false),
		percentageDiscount: z
			.enum(['1', '0.95', '0.9', '0.75', '0.6', '0.5', '0.4', '0.25', '0.1'])
			.optional(),
		expires: z.date().optional(),
	}),
	workshops: z.array(
		z.object({
			id: z.string(),
		}),
	),
})

export type CohortFormData = z.infer<typeof CohortFormDataSchema>

/**
 * Result of cohort creation
 */
export type CohortCreationResult = {
	cohort: ContentResource
	workshops?: ContentResource[]
}

/**
 * Props for CreateCohortForm
 */
export type CreateCohortFormProps = {
	/**
	 * Function to create cohort with workshops
	 */
	createCohort: (data: CohortFormData) => Promise<CohortCreationResult>
	/**
	 * Called on successful creation
	 */
	onSuccess: (result: CohortCreationResult) => Promise<void>
	/**
	 * Available tags for selection
	 */
	tags?: {
		id: string
		fields: {
			label: string
			name: string
		}
	}[]
	/**
	 * Available workshops for selection
	 */
	workshops: WorkshopOption[]
	/**
	 * Default timezone for dates
	 */
	defaultTimezone?: string
	/**
	 * Default price
	 * @default 0
	 */
	defaultPrice?: number
}

/**
 * Cohort creation form component
 *
 * @example
 * ```tsx
 * <CreateCohortForm
 *   createCohort={createCohortWithWorkshops}
 *   onSuccess={async (result) => {
 *     router.push(`/cohorts/${result.cohort.fields?.slug}/edit`)
 *   }}
 *   tags={tags}
 *   workshops={allWorkshops}
 * />
 * ```
 */
export function CreateCohortForm({
	createCohort,
	onSuccess,
	tags,
	workshops,
	defaultTimezone = 'America/Los_Angeles',
	defaultPrice = 0,
}: CreateCohortFormProps) {
	const form = useForm<CohortFormData>({
		resolver: zodResolver(CohortFormDataSchema),
		defaultValues: {
			cohort: {
				title: '',
				description: '',
				tagIds: undefined,
			},
			dates: {
				start: (() => {
					const now = new Date()
					now.setHours(0, 0, 0, 0)
					return now
				})(),
				end: (() => {
					const future = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
					future.setHours(0, 0, 0, 0)
					return future
				})(),
			},
			createProduct: false,
			pricing: {
				price: defaultPrice,
			},
			coupon: {
				enabled: false,
				percentageDiscount: '0.25',
				expires: undefined,
			},
			workshops: [],
		},
	})

	const { toast } = useToast()

	const onSubmit = async (data: CohortFormData) => {
		try {
			const result = await createCohort(data)

			await onSuccess(result)

			toast({
				title: 'Cohort created',
				description: `Cohort "${data.cohort.title}" created successfully`,
			})
		} catch (error) {
			console.error(error)
			toast({
				title: 'Failed to create cohort',
				description: error instanceof Error ? error.message : 'Unknown error',
				variant: 'destructive',
			})
		}
	}

	return (
		<Form {...form}>
			<form
				className="flex flex-col space-y-4"
				onSubmit={form.handleSubmit(onSubmit)}
			>
				{/* Cohort Details */}
				<div className="space-y-4 border-b pb-4">
					<h3 className="text-lg font-semibold">Cohort Details</h3>
					<FormField
						control={form.control}
						name="cohort.title"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Title</FormLabel>
								<FormControl>
									<Input {...field} placeholder="Cohort title" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="cohort.description"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Description</FormLabel>
								<FormControl>
									<textarea
										{...field}
										className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
										rows={3}
										placeholder="Cohort description"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Dates */}
				<div className="space-y-4 border-b pb-4">
					<h3 className="text-lg font-semibold">Schedule</h3>
					<div className="grid grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="dates.start"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Start Date</FormLabel>
									<FormControl>
										<DateTimePicker
											value={
												!!field.value
													? parseAbsolute(
															new Date(field.value).toISOString(),
															defaultTimezone,
														)
													: null
											}
											onChange={(date) => {
												field.onChange(
													!!date ? date.toDate(defaultTimezone) : null,
												)
											}}
											granularity="day"
										/>
									</FormControl>
									<FormDescription>Cohort enrollment starts</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="dates.end"
							render={({ field }) => (
								<FormItem>
									<FormLabel>End Date</FormLabel>
									<FormControl>
										<DateTimePicker
											value={
												!!field.value
													? parseAbsolute(
															new Date(field.value).toISOString(),
															defaultTimezone,
														)
													: null
											}
											onChange={(date) => {
												field.onChange(
													!!date ? date.toDate(defaultTimezone) : null,
												)
											}}
											granularity="day"
										/>
									</FormControl>
									<FormDescription>Cohort enrollment ends</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</div>

				{/* Product Creation Toggle */}
				<div className="space-y-4 border-b pb-4">
					<FormField
						control={form.control}
						name="createProduct"
						render={({ field }) => (
							<FormItem className="flex flex-row items-center justify-between">
								<div className="space-y-0.5">
									<FormLabel>Create Product</FormLabel>
									<FormDescription>
										Enable pricing and selling for this cohort
									</FormDescription>
								</div>
								<FormControl>
									<Switch
										checked={field.value}
										onCheckedChange={(checked) => {
											field.onChange(checked)
											// Set price to 250 when enabling product creation
											if (checked && !form.watch('pricing.price')) {
												form.setValue('pricing.price', 250)
											}
										}}
									/>
								</FormControl>
							</FormItem>
						)}
					/>
				</div>

				{/* Pricing */}
				{form.watch('createProduct') && (
					<div className="space-y-4 border-b pb-4">
						<h3 className="text-lg font-semibold">Pricing</h3>
						<FormField
							control={form.control}
							name="pricing.price"
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
					</div>
				)}

				{/* Coupon */}
				{form.watch('createProduct') &&
					form.watch('pricing.price') &&
					form.watch('pricing.price')! > 0 && (
						<div className="space-y-4 border-b pb-4">
							<h3 className="text-lg font-semibold">Discount Coupon</h3>
							<FormField
								control={form.control}
								name="coupon.enabled"
								render={({ field }) => (
									<FormItem className="flex flex-row items-center justify-between">
										<div className="space-y-0.5">
											<FormLabel>Create discount coupon</FormLabel>
											<FormDescription>
												Auto-apply coupon restricted to this cohort
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
														const originalPrice = form.watch('pricing.price')
														const discountPercentage = form.watch(
															'coupon.percentageDiscount',
														)

														if (originalPrice && discountPercentage) {
															const finalPrice =
																originalPrice * (1 - Number(discountPercentage))
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
																		defaultTimezone,
																	)
																: null
														}
														onChange={(date) => {
															field.onChange(
																!!date ? date.toDate(defaultTimezone) : null,
															)
														}}
														granularity="day"
													/>
												</FormControl>
												<FormDescription>
													Expires at 23:59:59 on the selected date
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							)}
						</div>
					)}

				{/* Workshops */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-lg font-semibold">Workshops (Optional)</h3>
							<p className="text-muted-foreground text-sm">
								Select workshops to include in this cohort, or leave empty to
								add later
							</p>
						</div>
					</div>

					<FormField
						control={form.control}
						name="workshops"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<WorkshopSelector
										workshops={workshops}
										selectedWorkshopIds={field.value.map((w) => w.id)}
										onChange={(ids) => {
											field.onChange(ids.map((id) => ({ id })))
										}}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<Button type="submit" disabled={form.formState.isSubmitting} size="lg">
					{form.formState.isSubmitting
						? 'Creating...'
						: `Create Cohort${form.watch('coupon.enabled') ? ' + Coupon' : ''}`}
				</Button>
			</form>
		</Form>
	)
}
