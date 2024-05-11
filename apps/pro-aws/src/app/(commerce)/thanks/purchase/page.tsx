import * as React from 'react'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { stripeProvider } from '@/coursebuilder/stripe-provider'
import { courseBuilderAdapter } from '@/db'
import {
	cancelPurchaseTransfer,
	getPurchaseTransferForPurchaseId,
	initiatePurchaseTransfer,
} from '@/purchase-transfer/purchase-transfer-actions'

import { InvoiceCard } from '@coursebuilder/commerce-next/invoices/invoice-card'
import { LoginLink } from '@coursebuilder/commerce-next/post-purchase/post-purchase-login-link'
import { PurchaseTransfer } from '@coursebuilder/commerce-next/post-purchase/post-purchase-purchase-transfer'
import { ThankYou } from '@coursebuilder/commerce-next/post-purchase/thank-you'
import { InlineTeamInvite } from '@coursebuilder/commerce-next/team/inline-team-invite'
import { convertToSerializeForNextResponse } from '@coursebuilder/commerce-next/utils/serialize-for-next-response'
import { Product, Purchase } from '@coursebuilder/core/schemas'
import {
	EXISTING_BULK_COUPON,
	INDIVIDUAL_TO_BULK_UPGRADE,
	NEW_BULK_COUPON,
	NEW_INDIVIDUAL_PURCHASE,
	PurchaseType,
} from '@coursebuilder/core/schemas/purchase-type'
import { logger } from '@coursebuilder/core/utils/logger'

const getServerSideProps = async (session_id: string) => {
	const paymentProvider = stripeProvider

	if (!session_id || !paymentProvider) {
		notFound()
	}

	const maxRetries = 5
	const initialDelay = 150
	const maxDelay = 15000

	let retries = 0
	let delay = initialDelay

	while (retries < maxRetries) {
		try {
			const purchaseInfo = await paymentProvider.getPurchaseInfo(
				session_id,
				courseBuilderAdapter,
			)

			const {
				email,
				chargeIdentifier,
				quantity: seatsPurchased,
				product: merchantProduct,
				purchaseType,
			} = purchaseInfo

			const stripeProductName = merchantProduct.name

			const purchase =
				await courseBuilderAdapter.getPurchaseForStripeCharge(chargeIdentifier)

			logger.debug('purchase', { purchase })

			if (!purchase || !email) {
				throw new Error('Purchase or email not found')
			}

			const product = await courseBuilderAdapter.getProduct(purchase.productId)

			return {
				purchase: convertToSerializeForNextResponse(purchase),
				email,
				seatsPurchased,
				purchaseType,
				bulkCouponId: purchase.bulkCoupon?.id || null,
				product: convertToSerializeForNextResponse(product) || null,
				stripeProductName,
			}
		} catch (error) {
			retries++
			await new Promise((resolve) => setTimeout(resolve, delay))
			delay = Math.min(delay * 2, maxDelay)
		}
	}

	notFound()
}

export default async function ThanksPurchasePage({
	searchParams,
}: {
	searchParams: { session_id: string; provider: string }
}) {
	headers()
	const { session_id } = searchParams
	const {
		purchase,
		email,
		seatsPurchased,
		purchaseType,
		bulkCouponId,
		product,
		stripeProductName,
	} = await getServerSideProps(session_id)

	return (
		<ThanksVerify
			email={email}
			seatsPurchased={seatsPurchased}
			purchaseType={purchaseType}
			bulkCouponId={bulkCouponId}
			product={product}
			stripeProductName={stripeProductName}
			purchase={purchase}
		/>
	)
}

const ThanksVerify: React.FC<
	React.PropsWithChildren<{
		email: string
		seatsPurchased: number
		purchaseType: PurchaseType
		bulkCouponId: string | null
		product: Product
		stripeProductName: string | null
		purchase: Purchase
	}>
> = ({
	email,
	seatsPurchased,
	purchaseType,
	bulkCouponId,
	product,
	stripeProductName,
	purchase,
}) => {
	let byline = null
	let title = `Thank you for purchasing ${stripeProductName}`
	let loginLink = null
	let inviteTeam = (
		<InlineTeamInvite
			bulkCouponId={bulkCouponId}
			seatsPurchased={seatsPurchased}
		/>
	)

	switch (purchaseType) {
		case NEW_INDIVIDUAL_PURCHASE:
			loginLink = LoginLink
			break
		case NEW_BULK_COUPON:
			byline = (
				<>
					Your purchase is for <strong>{seatsPurchased}</strong> seat
					{seatsPurchased > 1 && 's'}. You can always add more seats later when
					your team grows.
				</>
			)
			loginLink = LoginLink
			break
		case EXISTING_BULK_COUPON:
			title = `Thank you for purchasing more seats for ${
				product?.name || process.env.NEXT_PUBLIC_SITE_TITLE
			}!`
			byline = (
				<>
					Your purchase is for <strong>{seatsPurchased}</strong> additional seat
					{seatsPurchased > 1 && 's'}. You can always add more seats later when
					your team grows.
				</>
			)

			break
		case INDIVIDUAL_TO_BULK_UPGRADE:
			title = `Thank you for purchasing more seats for ${
				product?.name || process.env.NEXT_PUBLIC_SITE_TITLE
			}!`
			byline = (
				<>
					Your purchase is for <strong>{seatsPurchased}</strong> additional seat
					{seatsPurchased > 1 && 's'}. You can always add more seats later when
					your team grows.
				</>
			)

			break
	}

	return (
		<>
			<div>
				<main className="mx-auto flex w-full max-w-screen-md flex-col gap-8 px-5 py-24">
					<ThankYou
						title={title}
						byline={byline}
						product={product}
						email={email}
					/>
					{inviteTeam && inviteTeam}
					{loginLink && loginLink({ email })}
					<div>
						<h2 className="pb-2 text-sm font-semibold uppercase tracking-wide">
							Get your invoice
						</h2>
						<InvoiceCard
							purchase={{ product: { name: stripeProductName }, ...purchase }}
						/>
					</div>
					<PurchaseTransfer
						onTransferInitiated={async () => {
							'use server'
							revalidatePath('/thanks/purchase')
						}}
						cancelPurchaseTransfer={cancelPurchaseTransfer}
						getPurchaseTransferForPurchaseId={getPurchaseTransferForPurchaseId}
						initiatePurchaseTransfer={initiatePurchaseTransfer}
						purchase={purchase}
					/>
				</main>
			</div>
		</>
	)
}
