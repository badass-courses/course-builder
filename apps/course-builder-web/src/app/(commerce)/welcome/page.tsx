import * as React from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { stripeProvider } from '@/coursebuilder/stripe-provider'
import { courseBuilderAdapter } from '@/db'
import { githubAccountsForCurrentUser } from '@/lib/users'
import { convertToSerializeForNextResponse } from '@/path-to-purchase/serialize-for-next-response'
import { WelcomePage } from '@/path-to-purchase/welcome-page'
import { getPurchaseTransferForPurchaseId } from '@/purchase-transfer/purchase-transfer-actions'
import { authOptions, getServerAuthSession } from '@/server/auth'
import { isString } from 'lodash'

import { PurchaseUserTransfer } from '@coursebuilder/core/schemas'

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

	console.log({ providers })

	let purchaseId = query.purchaseId

	const session_id = query.session_id

	const paymentProvider = stripeProvider

	if (session_id && paymentProvider) {
		const { chargeIdentifier } = await paymentProvider.getPurchaseInfo(
			session_id,
			courseBuilderAdapter,
		)

		const purchase =
			await courseBuilderAdapter.getPurchaseForStripeCharge(chargeIdentifier)

		if (purchase) {
			purchaseId = purchase.id
		} else {
			redirect(`/thanks/purchase?session_id=${session_id}`)
		}
	}

	console.log({ user, purchaseId })

	if (user && isString(purchaseId) && isString(user?.id)) {
		const { purchase, existingPurchase, availableUpgrades } =
			await courseBuilderAdapter.getPurchaseDetails(purchaseId, user?.id)

		console.log({ purchase, existingPurchase, availableUpgrades })

		if (purchase) {
			const product = await courseBuilderAdapter.getProduct(purchase.productId)

			return {
				product,
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

const Welcome = async ({
	searchParams,
}: {
	searchParams: { session_id: string; provider: string; purchaseId: string }
}) => {
	headers()
	const { session } = await getServerAuthSession()

	const {
		upgrade,
		purchase,
		existingPurchase,
		product,
		providers = {},
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

	console.log({
		isGithubConnected,
		product,
		purchase,
		existingPurchase,
		upgrade,
		providers,
		hasCharge,
		redemptionsLeft,
		isTransferAvailable,
		purchaseUserTransfers,
		userEmail: session?.user?.email,
	})

	return (
		<div>
			<WelcomePage
				product={product}
				purchase={purchase}
				existingPurchase={existingPurchase}
				upgrade={upgrade}
				providers={providers}
				isGithubConnected={isGithubConnected}
				redemptionsLeft={redemptionsLeft}
				isTransferAvailable={isTransferAvailable}
				purchaseUserTransfers={purchaseUserTransfers}
				hasCharge={hasCharge}
				userEmail={session?.user?.email}
			/>
		</div>
	)
}

export default Welcome
