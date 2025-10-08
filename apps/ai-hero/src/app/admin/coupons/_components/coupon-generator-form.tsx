'use client'

import React, { use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/spinner'
import { env } from '@/env.mjs'
import { createCoupon } from '@/lib/coupons-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDate } from '@internationalized/date'
import { formatInTimeZone } from 'date-fns-tz'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Product } from '@coursebuilder/core/schemas'
import {
	Button,
	Calendar,
	Checkbox,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	DateTimePicker,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	useToast,
} from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

const formSchema = z
	.object({
		quantity: z.string(),
		// coupon
		maxUses: z.string(),
		expires: z.date().optional(),
		restrictedToProductId: z.string().optional(),
		discountType: z.enum(['percentage', 'fixed']).default('percentage'),
		percentOff: z.string().optional(),
		amountOff: z.string().optional(),
		bypassSoldOut: z.boolean().default(false),
		status: z.number().default(1),
		default: z.boolean().default(false),
	})
	.refine(
		(data) => {
			// Ensure one discount type is provided
			if (data.discountType === 'percentage') {
				return data.percentOff && Number(data.percentOff) > 0
			} else {
				return data.amountOff && Number(data.amountOff) > 0
			}
		},
		{
			message:
				'Please provide either a percentage discount or a fixed amount discount',
		},
	)

const CouponGeneratorForm = ({
	productsLoader,
}: {
	productsLoader: Promise<{ products: Product[]; pastEventIds: string[] }>
}) => {
	const router = useRouter()
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			quantity: '1',
			maxUses: '-1',
			restrictedToProductId: undefined,
			discountType: 'percentage',
			percentOff: '20',
			amountOff: undefined,
			expires: undefined,
			bypassSoldOut: false,
			status: 1,
			default: false,
		},
	})
	const [codes, setCodes] = React.useState<string[]>([])

	const { products, pastEventIds } = use(productsLoader)
	const { toast } = useToast()
	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		const { bypassSoldOut, ...couponDataFromForm } = values

		let finalExpires = couponDataFromForm.expires
		if (finalExpires instanceof Date) {
			// Create a new Date object for 23:59:59 UTC on the date part of finalExpires
			// finalExpires from the form should be a JS Date representing 00:00:00 LA time for the chosen day.
			// Its UTC date parts (getUTCFullYear, etc.) will give us the correct calendar day.
			finalExpires = new Date(
				Date.UTC(
					finalExpires.getUTCFullYear(),
					finalExpires.getUTCMonth(), // 0-indexed
					finalExpires.getUTCDate(),
					23, // hours
					59, // minutes
					59, // seconds
					0, // milliseconds
				),
			)
		}

		const codes = await createCoupon({
			quantity: couponDataFromForm.quantity,
			maxUses: Number(couponDataFromForm.maxUses),
			expires: finalExpires,
			restrictedToProductId: couponDataFromForm.restrictedToProductId,
			discountType: couponDataFromForm.discountType,
			percentageDiscount:
				couponDataFromForm.discountType === 'percentage' &&
				couponDataFromForm.percentOff
					? (Number(couponDataFromForm.percentOff) / 100).toString()
					: undefined,
			amountDiscount:
				couponDataFromForm.discountType === 'fixed' &&
				couponDataFromForm.amountOff
					? Number(couponDataFromForm.amountOff) * 100 // Convert to cents
					: undefined,
			status: Number(couponDataFromForm.status),
			default: couponDataFromForm.default,
			fields: {
				bypassSoldOut: bypassSoldOut,
			},
		})

		if (Boolean(couponDataFromForm.default)) {
			// TODO: toast notification about the default coupon being applied to product
			const product = products.find(
				(product) => product.id === couponDataFromForm.restrictedToProductId,
			)
			const resource = product?.resources?.[0]
			if (!product) {
				return
			}
			toast({
				duration: 10000,
				title: `Default coupon applied to ${resource?.resource?.fields?.title}`,
				description: (
					<>
						<Link
							className="text-primary underline"
							href={getResourcePath(
								resource?.resource.type,
								resource?.resource?.fields?.slug,
								'view',
							)}
						>
							View
						</Link>
					</>
				),
			})
			form.reset()
			return
		}

		const codesWithUrls = codes.map((code) => {
			const product = products.find(
				(product) => product.id === couponDataFromForm.restrictedToProductId,
			)
			if (!product) {
				return code
			}
			const resource = product.resources?.[0]
			if (!resource) {
				return code
			}
			console.log(resource)
			const url = getResourcePath(
				resource.resource.type,
				resource.resource.fields.slug,
				'view',
			)
			return `${env.NEXT_PUBLIC_URL}${url}?coupon=${code}`
		})
		setCodes(codesWithUrls)
		form.reset()
		// router.refresh()
	}
	const [isRestrictedToProductIdOpen, setIsRestrictedToProductIdOpen] =
		React.useState(false)
	return (
		<Form {...form}>
			<form className="" onSubmit={form.handleSubmit(onSubmit)}>
				<fieldset className="flex grid-cols-2 flex-col gap-5 space-y-5 lg:grid lg:space-y-0 xl:grid-cols-3">
					<FormField
						name="discountType"
						render={({ field }) => (
							<FormItem className="space-y-3">
								<FormLabel>Discount Type</FormLabel>
								<FormControl>
									<div className="flex space-x-4">
										<label className="flex cursor-pointer items-center space-x-2">
											<input
												type="radio"
												value="percentage"
												checked={field.value === 'percentage'}
												onChange={() => {
													field.onChange('percentage')
													form.setValue('amountOff', undefined)
												}}
												className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
											/>
											<span>Percentage</span>
										</label>
										<label className="flex cursor-pointer items-center space-x-2">
											<input
												type="radio"
												value="fixed"
												checked={field.value === 'fixed'}
												onChange={() => {
													field.onChange('fixed')
													form.setValue('percentOff', undefined)
												}}
												className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
											/>
											<span>Fixed Amount</span>
										</label>
									</div>
								</FormControl>
								<FormDescription>
									Choose between percentage or fixed dollar discount
								</FormDescription>
							</FormItem>
						)}
					/>
					{form.watch('discountType') === 'percentage' ? (
						<FormField
							name="percentOff"
							render={({ field }) => (
								<FormItem>
									<FormLabel htmlFor="percentOff" className="flex h-4">
										Discount Percentage
									</FormLabel>
									<FormControl>
										<Input
											type="number"
											id="percentOff"
											{...field}
											placeholder={'20'}
											min="0"
											max="100"
										/>
									</FormControl>
									<FormDescription>
										0-100 (e.g., 25 for 25% off)
									</FormDescription>
								</FormItem>
							)}
						/>
					) : (
						<FormField
							name="amountOff"
							render={({ field }) => (
								<FormItem>
									<FormLabel htmlFor="amountOff" className="flex h-4">
										Fixed Discount Amount ($)
									</FormLabel>
									<FormControl>
										<Input
											type="number"
											id="amountOff"
											{...field}
											placeholder={'20'}
											min="0"
											step="1"
										/>
									</FormControl>
									<FormDescription>
										Dollar amount (e.g., 20 for $20 off)
									</FormDescription>
								</FormItem>
							)}
						/>
					)}
					<FormField
						name="restrictedToProductId"
						render={({ field }) => {
							const value = field.value
							return (
								<FormItem className="flex flex-col">
									<FormLabel
										htmlFor="enableRestrictedToProductId"
										className="mb-0.5 mt-1.5 flex items-center gap-1.5"
									>
										<Checkbox
											id="enableRestrictedToProductId"
											checked={Boolean(form.watch('restrictedToProductId'))}
											onCheckedChange={() => {
												return Boolean(form.watch('restrictedToProductId'))
													? form.setValue('restrictedToProductId', undefined)
													: form.setValue(
															'restrictedToProductId',
															products[0]?.id,
														)
											}}
										/>
										Restricted to Product
									</FormLabel>
									<FormControl>
										<Popover
											open={isRestrictedToProductIdOpen}
											onOpenChange={setIsRestrictedToProductIdOpen}
										>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													role="combobox"
													aria-expanded={isRestrictedToProductIdOpen}
													className="justify-between"
												>
													<span className="truncate overflow-ellipsis">
														{value
															? products.find((product) => product.id === value)
																	?.name
															: 'Select product...'}
													</span>
													<ChevronsUpDown className="opacity-50" />
												</Button>
											</PopoverTrigger>
											<PopoverContent className="p-0">
												<Command>
													<CommandInput
														placeholder="Search product..."
														className="h-9"
													/>
													<CommandList>
														<CommandEmpty>No product found.</CommandEmpty>
														<CommandGroup>
															{products.map((product) => {
																const displayName = `${product.name}${
																	pastEventIds.some(
																		(id) =>
																			id ===
																			product?.resources?.[0]?.resource.id,
																	)
																		? ' (Closed)'
																		: ''
																}`
																return (
																	<CommandItem
																		key={product.id}
																		value={displayName}
																		onSelect={() => {
																			field.onChange(
																				product.id === value
																					? undefined
																					: product.id,
																			)
																			setIsRestrictedToProductIdOpen(false)
																		}}
																		className="flex w-full items-center justify-between"
																	>
																		<span>{displayName}</span>{' '}
																		<div className="flex items-center gap-1">
																			<span className="text-muted-foreground text-sm">
																				{product.type}
																			</span>
																			<Check
																				className={cn(
																					'ml-auto',
																					value === product.id
																						? 'opacity-100'
																						: 'opacity-0',
																				)}
																			/>
																		</div>
																	</CommandItem>
																)
															})}
														</CommandGroup>
													</CommandList>
												</Command>
											</PopoverContent>
										</Popover>
										{/* <Select
										required
										{...field}
										disabled={!Boolean(form.watch('restrictedToProductId'))}
										onValueChange={field.onChange}
									>
										<SelectTrigger className="truncate text-ellipsis pr-5 text-left">
											<SelectValue
												placeholder={
													Boolean(form.watch('restrictedToProductId'))
														? 'Select a product'
														: 'Global'
												}
											/>
										</SelectTrigger>
										<SelectContent>
											{products?.map((product: Product) => (
												<SelectItem key={product.id} value={product.id}>
													{product.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select> */}
									</FormControl>
								</FormItem>
							)
						}}
					/>
					<FormField
						name="expires"
						render={({ field }) => (
							<FormItem className="flex flex-col">
								<FormLabel
									htmlFor="enableExpires"
									className="mb-0.5 mt-1.5 flex items-center gap-1.5"
								>
									<Checkbox
										id="enableExpires"
										checked={Boolean(form.watch('expires'))}
										onCheckedChange={() => {
											return Boolean(form.watch('expires'))
												? form.setValue('expires', undefined)
												: form.setValue('expires', new Date())
										}}
									/>
									Expiration date
								</FormLabel>
								<DateTimePicker
									aria-label="Expiration date"
									value={(() => {
										const jsDateValue = field.value
										if (jsDateValue instanceof Date) {
											const year = parseInt(
												formatInTimeZone(
													jsDateValue,
													'America/Los_Angeles',
													'yyyy',
												),
												10,
											)
											const month = parseInt(
												formatInTimeZone(
													jsDateValue,
													'America/Los_Angeles',
													'MM',
												),
												10,
											)
											const day = parseInt(
												formatInTimeZone(
													jsDateValue,
													'America/Los_Angeles',
													'dd',
												),
												10,
											)
											return new CalendarDate(year, month, day)
										} else {
											return null
										}
									})()}
									onChange={(dateValue) => {
										// dateValue is CalendarDate | null from the picker
										field.onChange(
											dateValue
												? dateValue.toDate('America/Los_Angeles')
												: null,
										)
									}}
									shouldCloseOnSelect={true}
									granularity="day"
								/>
								<FormDescription>
									{(() => {
										const expiresDate = form.watch('expires')
										if (expiresDate) {
											return `${formatInTimeZone(
												new Date(expiresDate),
												'America/Los_Angeles',
												'yyyy-MM-dd',
											)} (Expires at 23:59:59 PT)`
										} else {
											return 'No expiration date set'
										}
									})()}
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						name="maxUses"
						render={({ field }) => (
							<FormItem className="flex flex-col gap-0.5">
								<FormLabel
									htmlFor="enableMaxUses"
									className="mt-1.5 flex items-center gap-1.5"
								>
									<Checkbox
										id="enableMaxUses"
										checked={form.watch('maxUses') !== '-1'}
										// onChange={() => form.setValue('maxUses', '1')}
										onCheckedChange={() => {
											return form.getValues('maxUses') === '1'
												? form.setValue('maxUses', '-1')
												: form.setValue('maxUses', '1')
										}}
									/>
									Limit max uses
								</FormLabel>
								<FormControl>
									{form.watch('maxUses') === '-1' ? (
										<Button
											onClick={() => {
												form.setValue('maxUses', '1')
											}}
											size="sm"
											variant="ghost"
											className="border-input h-10 justify-start border text-left text-base text-opacity-60"
										>
											Set
										</Button>
									) : (
										<Input
											disabled={form.watch('maxUses') === '-1'}
											type="number"
											id="maxUses"
											{...field}
											required
											onChange={(e) => {
												if (e.currentTarget.value === '0') {
													form.setValue('maxUses', '-1')
												} else {
													return field.onChange(e)
												}
											}}
											placeholder="-1"
										/>
									)}
								</FormControl>
							</FormItem>
						)}
					/>
					<FormField
						name="default"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<FormLabel
										className="mt-1.5 flex items-center gap-1.5 peer-disabled:cursor-not-allowed"
										htmlFor="default"
									>
										<Checkbox
											disabled={form.watch('maxUses') !== '-1'}
											id="default"
											checked={field.value}
											onCheckedChange={(value) => {
												form.setValue('bypassSoldOut', false)
												field.onChange(value)
											}}
										/>
										Auto Apply
									</FormLabel>
								</FormControl>
								<FormDescription>
									When enabled, this coupon gets applied automatically (sets{' '}
									<code>default</code> flag)
								</FormDescription>
							</FormItem>
						)}
					/>
					{!form.watch('default') && (
						<FormField
							name="bypassSoldOut"
							render={({ field }) => (
								<FormItem className="flex flex-col">
									<FormLabel
										htmlFor="bypassSoldOut"
										className="mt-1.5 flex items-center gap-1.5"
									>
										<Checkbox
											id="bypassSoldOut"
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
										Bypass Sold Out
									</FormLabel>
									<FormDescription>
										Allow purchasing even when a product is sold out.
									</FormDescription>
								</FormItem>
							)}
						/>
					)}
				</fieldset>
				<div className="mt-8 flex items-end gap-5">
					<div className="flex w-full flex-col justify-between gap-5 sm:flex-row sm:items-end">
						<div className="flex items-end gap-5">
							<FormField
								name="quantity"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Quantity</FormLabel>
										<FormControl>
											<Input
												type="number"
												id="quantity"
												{...field}
												required
												min={1}
												max={100}
											/>
										</FormControl>
									</FormItem>
								)}
							/>
							<Button disabled={form.formState.isSubmitting} type="submit">
								Generate{' '}
								{form.formState.isSubmitting && (
									<Spinner className="ml-1 h-5 w-4" />
								)}
							</Button>
						</div>
						<div
							key={codes.join('\n')}
							className="flex w-full items-end gap-2 sm:justify-end"
						>
							{codes.length > 0 && !form.formState.isDirty && (
								<>
									<Button
										disabled={form.formState.isSubmitting}
										type="button"
										onClick={() => downloadTextFile(codes.join('\n'))}
										className="bg-foreground text-background"
									>
										Download
									</Button>
									<Button
										disabled={form.formState.isSubmitting}
										type="button"
										onClick={() => {
											toast({ title: 'Copied to clipboard' })
											return navigator.clipboard.writeText(codes.join('\n'))
										}}
										variant="secondary"
									>
										Copy to clipboard
									</Button>
								</>
							)}
						</div>
					</div>
				</div>
			</form>
		</Form>
	)
}

export default CouponGeneratorForm

const downloadTextFile = (textData: string) => {
	const blob = new Blob([textData], { type: 'text/plain' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = 'codes.csv'
	a.click()
	URL.revokeObjectURL(url)
}
