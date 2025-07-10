'use client'

import React, { use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/spinner'
import { env } from '@/env.mjs'
import { createCoupon } from '@/lib/coupons-query'
import { getResourcePath } from '@/utils/resource-paths'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDate } from '@internationalized/date'
import { formatInTimeZone } from 'date-fns-tz'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Product } from '@coursebuilder/core/schemas'
import {
	Button,
	Calendar,
	Checkbox,
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

const formSchema = z.object({
	quantity: z.string(),
	// coupon
	maxUses: z.string(),
	expires: z.date().optional(),
	restrictedToProductId: z.string().optional(),
	percentOff: z.string(),
	bypassSoldOut: z.boolean().default(false),
	status: z.number().default(1),
	default: z.boolean().default(false),
})

const CouponGeneratorForm = ({
	productsLoader,
}: {
	productsLoader: Promise<Product[]>
}) => {
	const router = useRouter()
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			quantity: '1',
			maxUses: '-1',
			restrictedToProductId: undefined,
			percentOff: '20',
			expires: undefined,
			bypassSoldOut: false,
			status: 1,
			default: false,
		},
	})
	const [codes, setCodes] = React.useState<string[]>([])

	const products = use(productsLoader)
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
			percentageDiscount: (
				Number(couponDataFromForm.percentOff) / 100
			).toString(),
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

	return (
		<Form {...form}>
			<form className="" onSubmit={form.handleSubmit(onSubmit)}>
				<fieldset className="flex grid-cols-2 flex-col gap-5 space-y-5 lg:grid lg:space-y-0 xl:grid-cols-3">
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
										required
										placeholder={'20'}
									/>
								</FormControl>
								<FormDescription>Required</FormDescription>
							</FormItem>
						)}
					/>
					<FormField
						name="restrictedToProductId"
						render={({ field }) => (
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
									<Select
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
									</Select>
								</FormControl>
							</FormItem>
						)}
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
