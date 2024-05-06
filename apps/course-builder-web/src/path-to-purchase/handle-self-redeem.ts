/**
 * handle self redeeming of a seat in bulk purchase
 * @param {string} email current user's email from session
 * @param {string} bulkCouponId current user's bulk coupon id from purchase
 * @param {(params) => void} callback function to be called after attempting coupon redemption
 */

import { redeemFullPriceCoupon } from '@coursebuilder/commerce-next/pricing/redeem-full-price-coupon'
import { Purchase } from '@coursebuilder/core/schemas'

type CallbackParams =
	| { status: 'success'; redeemedPurchase: Purchase }
	| { status: 'failed'; error: string }

export async function handleSelfRedeem(
	email: string,
	bulkCouponId: string,
	productId: string | undefined,
	callback: (params: CallbackParams) => void,
) {
	const productIds = productId ? [productId] : []

	const { purchase: redeemedPurchase } = await redeemFullPriceCoupon({
		email,
		couponId: bulkCouponId,
		productIds,
		sendEmail: false,
	})
	if (redeemedPurchase && !redeemedPurchase.error) {
		await fetch('/api/auth/session?update')
		callback({ status: 'success', redeemedPurchase })
	} else {
		callback({ status: 'failed', error: redeemedPurchase.message })
	}
}
