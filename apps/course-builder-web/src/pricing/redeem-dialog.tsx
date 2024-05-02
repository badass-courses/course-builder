import * as React from 'react'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import { useFormik } from 'formik'
import { useSession } from 'next-auth/react'
import Balancer from 'react-wrap-balancer'
import * as Yup from 'yup'

import { Product } from '@coursebuilder/core/schemas'

import { redeemFullPriceCoupon } from './redeem-full-price-coupon'

const validationSchema = Yup.object().shape({
	email: Yup.string().email('Invalid email').required('Required'),
})

interface RedeemDialogProps {
	open: boolean
	couponId: string
	product?: Product
}

const RedeemDialog = ({
	open = false,
	couponId,
	product,
}: RedeemDialogProps) => {
	const { data: session } = useSession()
	const router = useRouter()

	const productIds: string[] = product?.id ? [product.id] : []

	const formik = useFormik({
		initialValues: {
			email: session?.user?.email || '',
		},
		validationSchema,
		onSubmit: async ({ email }) => {
			const { purchase, redeemingForCurrentUser } = await redeemFullPriceCoupon(
				{
					email,
					couponId,
					productIds,
				},
			)

			if (purchase.error) {
				console.error(purchase.message)
			} else {
				if (redeemingForCurrentUser) {
					await fetch('/api/auth/session?update')
					router.push(`/welcome?purchaseId=${purchase?.id}`)
				} else {
					router.push(`/thanks/redeem?purchaseId=${purchase?.id}`)
				}
			}
		},
	})
	const {
		name: title,
		fields: { image, description },
	} = product || { fields: {} }
	const query = useSearchParams()
	const pathName = usePathname()

	return (
		<AlertDialogPrimitive.Root data-redeem-dialog="" open={open}>
			<Content>
				{image && title && (
					<div className="flex w-full flex-col items-center justify-center border-b border-gray-200 px-5 pb-5 pt-8 text-center dark:border-gray-700">
						{image && (
							<Image src={image.url} alt="" aria-hidden layout="fill" />
						)}
						{title ? (
							<div className="pt-5 text-lg font-medium">
								<Balancer>
									Coupon for {title} by{' '}
									{process.env.NEXT_PUBLIC_PARTNER_FIRST_NAME}{' '}
									{process.env.NEXT_PUBLIC_PARTNER_LAST_NAME}
								</Balancer>
							</div>
						) : null}
					</div>
				)}
				<AlertDialogPrimitive.Title data-title="">
					Do you want to redeem this coupon?
				</AlertDialogPrimitive.Title>
				<AlertDialogPrimitive.Description data-description="">
					Enter the email address you wish to be associated with your license.
					We recommend using an email address you will have access to for years
					to come. Please triple check the address!
				</AlertDialogPrimitive.Description>
				<form onSubmit={formik.handleSubmit}>
					<div data-email="">
						<label htmlFor="email">Email address</label>
						<input
							required
							id="email"
							type="email"
							onChange={formik.handleChange}
							value={formik.values.email}
							placeholder="you@example.com"
						/>
					</div>
					<div data-actions="">
						<AlertDialogPrimitive.Cancel asChild>
							<button
								onClick={(e) => {
									const code = query.get('code')
									const pathname = pathName.replace(`?code=${code}`, '')
									router.push(pathname)
								}}
								data-cancel=""
							>
								Cancel
							</button>
						</AlertDialogPrimitive.Cancel>
						<AlertDialogPrimitive.Action asChild>
							<button data-submit="" type="submit">
								Yes, Claim License
							</button>
						</AlertDialogPrimitive.Action>
					</div>
				</form>
			</Content>
		</AlertDialogPrimitive.Root>
	)
}

export default RedeemDialog

const Content: React.FC<React.PropsWithChildren<unknown>> = ({
	children,
	...props
}) => {
	return (
		<>
			<AlertDialogPrimitive.Overlay data-redeem-dialog-overlay="" />
			<AlertDialogPrimitive.Content data-redeem-dialog-content="" {...props}>
				{children}
			</AlertDialogPrimitive.Content>
		</>
	)
}
