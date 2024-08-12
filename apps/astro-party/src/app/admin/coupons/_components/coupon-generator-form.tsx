'use client'

import React, { use } from 'react'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/spinner'
import { createCoupon } from '@/lib/coupons-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { CalendarIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'

import { Product } from '@coursebuilder/core/schemas'
import {
	Button,
	Calendar,
	Checkbox,
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
} from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

const formSchema = z.object({
	quantity: z.string(),
	// coupon
	maxUses: z.string(),
	expires: z.date().optional(),
	restrictedToProductId: z.string().optional(),
	percentOff: z.string(),
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
		},
	})
	const [codes, setCodes] = React.useState<string[]>([])

	const products = use(productsLoader)

	const expiresAtDateTime = form.watch('expires')?.setHours(23, 59, 0, 0)
	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		form.reset()
		await createCoupon({
			quantity: values.quantity,
			maxUses: Number(values.maxUses),
			expires: values.expires,
			restrictedToProductId: values.restrictedToProductId,
			percentageDiscount: (Number(values.percentOff) / 100).toString(),
		})
		router.refresh()
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<fieldset className="grid-cols-4 gap-5 space-y-5 md:grid md:space-y-0">
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
										onChange={field.onChange}
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
											console.log(
												'checked',
												form.watch('restrictedToProductId'),
											)
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
										<SelectTrigger>
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
								<Popover>
									<PopoverTrigger asChild>
										<FormControl>
											<Button
												variant={'outline'}
												className={cn(
													'w-[240px] pl-3 text-left font-normal',
													!field.value && 'text-muted-foreground',
												)}
											>
												{field.value ? (
													format(field.value, 'PPP')
												) : (
													<span>Pick a date</span>
												)}
												<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
											</Button>
										</FormControl>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={field.value}
											onSelect={(date) => {
												return field.onChange(date)
											}}
											disabled={(date) =>
												date < new Date() || date < new Date('1900-01-01')
											}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
								<FormDescription>
									{/* {form.watch('expires')?.toUTCString()} */}
									{expiresAtDateTime &&
										new Date(expiresAtDateTime).toISOString()}
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
												onChange={field.onChange}
												defaultValue={1}
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
						<motion.div
							key={codes.join('\n')}
							animate={{
								opacity: form.formState.isSubmitted ? [1, 0.5, 1] : 1,
							}}
							className="flex w-full items-end gap-2 sm:justify-end"
						>
							{form.formState.isSubmitted && codes && (
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
											toast.success('Copied to clipboard')
											return navigator.clipboard.writeText(codes.join('\n'))
										}}
										variant="secondary"
									>
										Copy to clipboard
									</Button>
								</>
							)}
						</motion.div>
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
