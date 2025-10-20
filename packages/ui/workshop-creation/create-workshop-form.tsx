'use client'

import React, { useReducer } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { parseAbsolute } from '@internationalized/date'
import { Folder, ListPlus, Plus, Trash2, Video } from 'lucide-react'
import { useForm } from 'react-hook-form'
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
import { LessonVideoField, type VideoUploadProps } from './lesson-video-field'
import {
	getInitialTreeState,
	treeStateReducer,
	type TreeItem,
} from './tree-utils'

/**
 * Schema for workshop creation form
 */
export const WorkshopFormDataSchema = z.object({
	workshop: z.object({
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
	createProduct: z.boolean().default(false),
	pricing: z.object({
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
	structure: z.array(
		z.discriminatedUnion('type', [
			z.object({
				type: z.literal('section'),
				title: z.string().min(2),
				lessons: z.array(
					z.object({
						title: z.string().min(2),
						videoResourceId: z.string().optional(),
					}),
				),
			}),
			z.object({
				type: z.literal('lesson'),
				title: z.string().min(2),
				videoResourceId: z.string().optional(),
			}),
		]),
	),
})

export type WorkshopFormData = z.infer<typeof WorkshopFormDataSchema>

/**
 * Result of workshop creation
 */
export type WorkshopCreationResult = {
	workshop: ContentResource
	lessons?: ContentResource[]
	sections?: ContentResource[]
}

/**
 * Props for CreateWorkshopForm
 */
export type CreateWorkshopFormProps = {
	/**
	 * Function to create workshop with structure
	 */
	createWorkshop: (data: WorkshopFormData) => Promise<WorkshopCreationResult>
	/**
	 * Called on successful creation
	 */
	onSuccess: (result: WorkshopCreationResult) => Promise<void>
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
	 * Default timezone for events
	 */
	defaultTimezone?: string
	/**
	 * Default price
	 * @default 0
	 */
	defaultPrice?: number
	/**
	 * Default quantity
	 * @default -1
	 */
	defaultQuantity?: number
	/**
	 * Render prop for video uploader
	 */
	children: (props: VideoUploadProps) => React.ReactNode
}

/**
 * Workshop creation form component
 *
 * @example
 * ```tsx
 * <CreateWorkshopForm
 *   createWorkshop={createWorkshopWithLessons}
 *   onSuccess={async (result) => {
 *     router.push(`/workshops/${result.workshop.fields?.slug}/edit`)
 *   }}
 *   tags={tags}
 * >
 *   {(props) => (
 *     <UploadDropzone
 *       endpoint="videoUploader"
 *       onClientUploadComplete={(response) => {
 *         props.onUploadComplete(response[0]?.name)
 *       }}
 *       input={{ parentResourceId: props.parentResourceId }}
 *     />
 *   )}
 * </CreateWorkshopForm>
 * ```
 */
export function CreateWorkshopForm({
	createWorkshop,
	onSuccess,
	tags,
	defaultTimezone = 'America/Los_Angeles',
	defaultPrice = 0,
	defaultQuantity = -1,
	children,
}: CreateWorkshopFormProps) {
	const form = useForm<WorkshopFormData>({
		resolver: zodResolver(WorkshopFormDataSchema),
		defaultValues: {
			workshop: {
				title: '',
				description: '',
				tagIds: undefined,
			},
			createProduct: false,
			pricing: {
				price: defaultPrice,
				quantity: defaultQuantity,
			},
			coupon: {
				enabled: false,
				percentageDiscount: '0.25',
				expires: undefined,
			},
			structure: [],
		},
	})

	const [treeState, updateTreeState] = useReducer(
		treeStateReducer,
		[],
		getInitialTreeState,
	)

	const { toast } = useToast()

	const addSection = () => {
		const title = `Section ${treeState.data.filter((item) => item.type === 'section').length + 1}`
		updateTreeState({
			type: 'add-section',
			title,
		})
	}

	const addLesson = (parentId?: string) => {
		const lessonCount = treeState.data.reduce((count, item) => {
			if (item.type === 'lesson') return count + 1
			return count + (item.children?.length || 0)
		}, 0)
		const title = `Lesson ${lessonCount + 1}`
		updateTreeState({
			type: 'add-lesson',
			title,
			parentId,
		})
	}

	const removeItem = (itemId: string) => {
		updateTreeState({
			type: 'remove-item',
			itemId,
		})
	}

	const updateItemTitle = (itemId: string, title: string) => {
		updateTreeState({
			type: 'update-item',
			itemId,
			fields: { label: title },
		})
	}

	const updateItemVideo = (itemId: string, videoResourceId?: string) => {
		updateTreeState({
			type: 'update-item',
			itemId,
			fields: { videoResourceId },
		})
	}

	const toggleSection = (itemId: string) => {
		updateTreeState({
			type: 'toggle',
			itemId,
		})
	}

	const onSubmit = async (data: WorkshopFormData) => {
		try {
			// Convert tree structure to form data
			const structure = treeState.data.map((item) => {
				if (item.type === 'section') {
					return {
						type: 'section' as const,
						title: item.label || 'Untitled Section',
						lessons:
							item.children?.map((child) => ({
								title: child.label || 'Untitled Lesson',
								videoResourceId: child.videoResourceId,
							})) || [],
					}
				} else {
					return {
						type: 'lesson' as const,
						title: item.label || 'Untitled Lesson',
						videoResourceId: item.videoResourceId,
					}
				}
			})

			const formData: WorkshopFormData = {
				...data,
				structure,
			}

			const result = await createWorkshop(formData)

			await onSuccess(result)

			toast({
				title: 'Workshop created',
				description: `Workshop "${data.workshop.title}" created successfully`,
			})
		} catch (error) {
			console.error(error)
			toast({
				title: 'Failed to create workshop',
				description: error instanceof Error ? error.message : 'Unknown error',
				variant: 'destructive',
			})
		}
	}

	const renderTreeItem = (item: TreeItem, depth = 0) => {
		if (item.type === 'section') {
			return (
				<AccordionItem
					key={item.id}
					value={item.id}
					className="border-border rounded-lg border"
				>
					<AccordionTrigger className="hover:bg-muted rounded-lg px-4 py-3 hover:no-underline">
						<div className="flex w-full items-center justify-between pr-2">
							<div className="flex items-center gap-2">
								<Folder className="h-4 w-4" />
								<Input
									value={item.label || ''}
									onChange={(e) => {
										e.stopPropagation()
										updateItemTitle(item.id, e.target.value)
									}}
									onClick={(e) => e.stopPropagation()}
									className="h-8 border-0 bg-transparent p-0 font-semibold focus-visible:ring-0"
									placeholder="Section title"
								/>
							</div>
							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={(e) => {
										e.stopPropagation()
										addLesson(item.id)
									}}
								>
									<Plus className="h-4 w-4" />
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={(e) => {
										e.stopPropagation()
										removeItem(item.id)
									}}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</AccordionTrigger>
					<AccordionContent className="border-t px-4 py-3">
						<div className="space-y-2">
							{item.children && item.children.length > 0 ? (
								item.children.map((child) => renderTreeItem(child, depth + 1))
							) : (
								<p className="text-muted-foreground text-sm">
									No lessons yet. Add one!
								</p>
							)}
						</div>
					</AccordionContent>
				</AccordionItem>
			)
		} else {
			return (
				<div
					key={item.id}
					className="border-border bg-muted rounded-md border p-3"
				>
					<div className="mb-2 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Video className="h-4 w-4" />
							<Input
								value={item.label || ''}
								onChange={(e) => updateItemTitle(item.id, e.target.value)}
								className="h-8 border-0 bg-transparent p-0 font-medium focus-visible:ring-0"
								placeholder="Lesson title"
							/>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => removeItem(item.id)}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
					<LessonVideoField
						videoResourceId={item.videoResourceId}
						onChange={(videoId) => updateItemVideo(item.id, videoId)}
					>
						{children}
					</LessonVideoField>
				</div>
			)
		}
	}

	return (
		<Form {...form}>
			<form
				className="flex flex-col space-y-4"
				onSubmit={form.handleSubmit(onSubmit)}
			>
				{/* Workshop Details */}
				<div className="space-y-4 border-b pb-4">
					<h3 className="text-lg font-semibold">Workshop Details</h3>
					<FormField
						control={form.control}
						name="workshop.title"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Title</FormLabel>
								<FormControl>
									<Input {...field} placeholder="Workshop title" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="workshop.description"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Description</FormLabel>
								<FormControl>
									<textarea
										{...field}
										className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
										rows={3}
										placeholder="Workshop description"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
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
										Enable pricing and selling for this workshop
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
												Auto-apply coupon restricted to this workshop
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

				{/* Structure */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-semibold">Content Structure</h3>
						<div className="flex gap-2">
							<Button type="button" variant="outline" onClick={addSection}>
								<Folder className="mr-2 h-4 w-4" /> Add Section
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() => addLesson()}
							>
								<Video className="mr-2 h-4 w-4" /> Add Lesson
							</Button>
						</div>
					</div>

					{treeState.data.length > 0 ? (
						<Accordion
							type="multiple"
							defaultValue={treeState.data
								.filter((item) => item.type === 'section')
								.map((item) => item.id)}
							className="space-y-2"
						>
							{treeState.data.map((item) => renderTreeItem(item))}
						</Accordion>
					) : (
						<div className="border-border text-muted-foreground rounded-lg border border-dashed p-8 text-center">
							<p>No content yet. Add sections and lessons to get started.</p>
						</div>
					)}
				</div>

				<Button type="submit" disabled={form.formState.isSubmitting} size="lg">
					{form.formState.isSubmitting
						? 'Creating...'
						: `Create Workshop${form.watch('coupon.enabled') ? ' + Coupon' : ''}`}
				</Button>
			</form>
		</Form>
	)
}
