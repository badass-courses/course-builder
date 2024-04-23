import * as React from 'react'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { stripeProvider } from '@/coursebuilder/stripe-provider'
import { courseBuilderAdapter } from '@/db'
import { InlineTeamInvite } from '@/path-to-purchase/inline-team-invite'
import { InvoiceCard } from '@/path-to-purchase/invoice-card'
import { LoginLink } from '@/path-to-purchase/post-purchase-login-link'
import { PurchaseTransfer } from '@/path-to-purchase/post-purchase-purchase-transfer'
import { convertToSerializeForNextResponse } from '@/path-to-purchase/serialize-for-next-response'
import { ThankYou } from '@/path-to-purchase/thank-you'

import { Product, Purchase } from '@coursebuilder/core/schemas'
import {
	EXISTING_BULK_COUPON,
	INDIVIDUAL_TO_BULK_UPGRADE,
	NEW_BULK_COUPON,
	NEW_INDIVIDUAL_PURCHASE,
	PurchaseType,
} from '@coursebuilder/core/schemas/purchase-type'

const getServerSideProps = async (session_id: string) => {
	const paymentProvider = stripeProvider

	if (!session_id || !paymentProvider) {
		notFound()
	}

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

	if (!purchase || !email) {
		return notFound()
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
					<PurchaseTransfer purchase={purchase} />
				</main>
			</div>
		</>
	)
}
