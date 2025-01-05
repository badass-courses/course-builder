import * as React from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { stripeProvider } from '@/coursebuilder/stripe-provider'
import { courseBuilderAdapter } from '@/db'
import {
	discordAccountsForCurrentUser,
	githubAccountsForCurrentUser,
} from '@/lib/users'
import {
	cancelPurchaseTransfer,
	getPurchaseTransferForPurchaseId,
	initiatePurchaseTransfer,
} from '@/purchase-transfer/purchase-transfer-actions'
import { authOptions, getServerAuthSession } from '@/server/auth'

import { WelcomePage } from '@coursebuilder/commerce-next/post-purchase/welcome-page'
import { convertToSerializeForNextResponse } from '@coursebuilder/commerce-next/utils/serialize-for-next-response'
import { PurchaseUserTransfer } from '@coursebuilder/core/schemas'
import { isString } from '@coursebuilder/nodash'

async function getPurchaseForChargeId(chargeIdentifier: string) {
	const maxRetries = 5
	const initialDelay = 150
	const maxDelay = 15000

	let retries = 0
	let delay = initialDelay

	while (retries < maxRetries) {
		try {
			const purchase =
				await courseBuilderAdapter.getPurchaseForStripeCharge(chargeIdentifier)

			if (!purchase) {
				throw new Error('purchase not found')
			}

			return purchase
		} catch (error) {
			retries++
			await new Promise((resolve) => setTimeout(resolve, delay))
			delay = Math.min(delay * 2, maxDelay)
		}
	}
}

const getServerSideProps = async (query: {
	session_id: string
	provider: string
	purchaseId: string
	upgrade?: 'true'
}) => {
	const token = await getServerAuthSession()
	const user = token.session?.user

	const providers = authOptions.providers.map((p) => {
		return {
			// @ts-ignore
			id: p.id,
			name: p.name,
		}
	})

	let purchaseId = query.purchaseId

	const session_id = query.session_id

	const paymentProvider = stripeProvider

	if (session_id && paymentProvider) {
		const { chargeIdentifier } = await paymentProvider.getPurchaseInfo(
			session_id,
			courseBuilderAdapter,
		)

		const purchase = await getPurchaseForChargeId(chargeIdentifier)

		if (purchase) {
			purchaseId = purchase.id
		} else {
			redirect(`/thanks/purchase?session_id=${session_id}`)
		}
	}

	if (user && isString(purchaseId) && isString(user?.id)) {
		const { purchase, existingPurchase, availableUpgrades } =
			await courseBuilderAdapter.getPurchaseDetails(purchaseId, user?.id)

		if (purchase) {
			const product = await courseBuilderAdapter.getProduct(purchase.productId)
			const productResources = await courseBuilderAdapter.getProductResources(
				purchase.productId,
			)

			return {
				product,
				productResources,
				purchase: convertToSerializeForNextResponse(purchase),
				existingPurchase,
				availableUpgrades,
				upgrade: query.upgrade === 'true',
				providers,
			}
		} else {
			redirect(`/`)
		}
	}

	redirect(`/`)
}

const Welcome = async (props: {
	searchParams: Promise<{
		session_id: string
		provider: string
		purchaseId: string
	}>
}) => {
	const searchParams = await props.searchParams
	await headers()
	const { session } = await getServerAuthSession()

	const {
		upgrade,
		purchase,
		existingPurchase,
		product,
		providers = {},
		productResources,
	} = await getServerSideProps(searchParams)

	const redemptionsLeft =
		purchase.bulkCoupon &&
		purchase.bulkCoupon.maxUses > purchase.bulkCoupon.usedCount

	const hasCharge = Boolean(purchase.merchantChargeId)

	const purchaseUserTransfers = await getPurchaseTransferForPurchaseId({
		id: purchase.id,
		sourceUserId: session?.user?.id,
	})

	const isTransferAvailable =
		!purchase.bulkCoupon &&
		Boolean(
			purchaseUserTransfers?.filter(
				(purchaseUserTransfer: PurchaseUserTransfer) =>
					['AVAILABLE', 'INITIATED', 'COMPLETED'].includes(
						purchaseUserTransfer.transferState,
					),
			).length,
		)

	const isGithubConnected = await githubAccountsForCurrentUser()
	const isDiscordConnected = await discordAccountsForCurrentUser()

	return (
		<div className="container">
			<WelcomePage
				product={product}
				productResources={productResources}
				purchase={purchase}
				existingPurchase={existingPurchase}
				upgrade={upgrade}
				providers={providers}
				isGithubConnected={isGithubConnected}
				isDiscordConnected={isDiscordConnected}
				redemptionsLeft={redemptionsLeft}
				isTransferAvailable={isTransferAvailable}
				purchaseUserTransfers={purchaseUserTransfers}
				hasCharge={hasCharge}
				userEmail={session?.user?.email}
				cancelPurchaseTransfer={cancelPurchaseTransfer}
				initiatePurchaseTransfer={initiatePurchaseTransfer}
				// welcomeVideoPlaybackId={
				// 	'sNy02WxzolM9RIiL900DJ5jL02IV1hKRTEDPQ32vLctTy4'
				// }
			/>
		</div>
	)
}

export default Welcome
