import * as React from 'react'
import Image from 'next/image.js'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useFormik } from 'formik'
import { useSession } from 'next-auth/react'
import Balancer from 'react-wrap-balancer'
import * as Yup from 'yup'

import { Product } from '@coursebuilder/core/schemas'
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogOverlay,
	DialogTitle,
	Input,
	Label,
	useToast,
} from '@coursebuilder/ui'

import { redeemFullPriceCoupon } from '../coupons/redeem-full-price-coupon'

const validationSchema = Yup.object().shape({
	email: Yup.string().email('Invalid email').required('Required'),
})

interface RedeemDialogProps {
	open: boolean
	couponId: string
	product?: Product
}

const RedeemDialog = ({
	open: initialOpen = false,
	couponId,
	product,
}: RedeemDialogProps) => {
	const [open, setOpen] = React.useState(initialOpen)
	const [isLoading, setLoading] = React.useState(false)
	const [errorMessage, setErrorMessage] = React.useState<{
		title: string
		description: string
	} | null>(null)
	const { data: session } = useSession()
	const router = useRouter()
	const { toast } = useToast()
	const productIds: string[] = product?.id ? [product.id] : []

	const formik = useFormik({
		initialValues: {
			email: session?.user?.email || '',
		},
		validationSchema,
		onSubmit: async ({ email }) => {
			setLoading(true)
			const { purchase, redeemingForCurrentUser, error } =
				await redeemFullPriceCoupon({
					email,
					couponId,
					productIds,
				})

			if (purchase && !error) {
				if (redeemingForCurrentUser) {
					await fetch('/api/auth/session?update')
					router.push(`/welcome?purchaseId=${purchase?.id}`)
				} else {
					router.push(`/thanks/redeem?purchaseId=${purchase?.id}`)
				}
				return setOpen(false)
			} else {
				if (error.message.startsWith('already-purchased-')) {
					const message = {
						title: `We were unable to redeem a seat for ${email}.`,
						description:
							'This email address already has access to this product.',
					}

					setErrorMessage(message)
					toast(message)
				} else {
					const message = {
						title: `We were unable to redeem a seat for ${email}.`,
						description:
							'We were unable to redeem a seat for this account. If the issue persists, please reach out to support.',
					}

					setErrorMessage(message)
					toast(message)
				}

				return setLoading(false)
			}
		},
	})
	const {
		name: title,
		fields: { image, description },
	} = product || { fields: {} }
	const query = useSearchParams()
	const pathName = usePathname()

	function dismissDialog() {
		const code = query.get('code')
		let pathname = pathName.replace(`?code=${code}`, '')
		const coupon = query.get('coupon')
		pathname = pathname.replace(`?coupon=${coupon}`, '')
		router.push(pathname)
		setOpen(false)
	}

	return (
		<Dialog data-redeem-dialog="" onOpenChange={dismissDialog} open={open}>
			<DialogOverlay />
			<DialogContent>
				{image && title && (
					<div className="flex w-full flex-col items-center justify-center border-b border-gray-200 px-5 pb-5 pt-8 text-center dark:border-gray-700">
						{image && (
							<Image
								src={image.url}
								alt=""
								aria-hidden
								width={100}
								height={100}
								priority
							/>
						)}
						{title ? (
							<div className="p-5 px-5 text-lg font-medium">
								<Balancer>
									Coupon for {title} by{' '}
									{process.env.NEXT_PUBLIC_PARTNER_FIRST_NAME}{' '}
									{process.env.NEXT_PUBLIC_PARTNER_LAST_NAME}
								</Balancer>
							</div>
						) : null}
					</div>
				)}
				<DialogTitle data-title="">
					Do you want to redeem this coupon?
				</DialogTitle>
				<DialogDescription data-description="">
					Enter the email address you wish to be associated with your license.
					We recommend using an email address you will have access to for years
					to come. Please triple check the address!
				</DialogDescription>
				<form className="flex flex-col gap-3" onSubmit={formik.handleSubmit}>
					<div data-email="">
						<Label htmlFor="email">Email address</Label>
						<Input
							required
							id="email"
							type="email"
							onChange={formik.handleChange}
							value={formik.values.email}
							placeholder="you@example.com"
						/>
					</div>
					<DialogFooter data-actions="" className="gap-y-2">
						<DialogClose asChild>
							<Button variant="outline" onClick={dismissDialog} data-cancel="">
								Cancel
							</Button>
						</DialogClose>
						<Button data-submit="" type="submit" disabled={isLoading}>
							{isLoading ? 'Claiming...' : 'Yes, Claim License'}
						</Button>
					</DialogFooter>
					{errorMessage && (
						<Alert variant={'destructive'}>
							<AlertTitle>{errorMessage.description}</AlertTitle>
							<AlertDescription>{errorMessage.title}</AlertDescription>
						</Alert>
					)}
				</form>
			</DialogContent>
		</Dialog>
	)
}

export default RedeemDialog
