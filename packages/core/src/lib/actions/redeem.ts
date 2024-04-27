import { v4 } from 'uuid'
import { z } from 'zod'

import { InternalOptions, RequestInternal, ResponseInternal } from '../../types'
import { Cookie } from '../utils/cookie'
import { validateCoupon } from '../utils/validate-coupon'

export async function redeem(
	request: RequestInternal,
	cookies: Cookie[],
	options: InternalOptions,
): Promise<ResponseInternal> {
	if (!options.adapter) throw new Error('Adapter not found')

	const { findOrCreateUser, getCouponWithBulkPurchases } = options.adapter

	const {
		email: baseEmail,
		couponId,
		sendEmail = true,
		productIds,
	} = z
		.object({
			email: z.string().email(),
			couponId: z.string().optional(),
			sendEmail: z.boolean().optional().default(true),
			productIds: z.array(z.string()).optional(),
		})
		.parse(request.body)

	if (!baseEmail) throw new Error(`invaild-email-${baseEmail}`)

	// something in the chain strips out the plus and leaves a space
	const email = String(baseEmail).replace(' ', '+')

	const coupon = await getCouponWithBulkPurchases(couponId)

	const couponValidation = validateCoupon(coupon, productIds)

	if (coupon && couponValidation.isRedeemable) {
		// if the Coupon is the Bulk Coupon of a Bulk Purchase,
		// then a bulk coupon is being redeemed
		const bulkCouponRedemption = Boolean(
			coupon.bulkCouponPurchases[0]?.bulkCouponId,
		)

		const { user } = await findOrCreateUser(email)

		if (!user) throw new Error(`unable-to-create-user-${email}`)

		const currentUser = await options.getCurrentUser?.()

		const redeemingForCurrentUser = currentUser?.id === user.id

		const productId =
			(coupon.restrictedToProductId as string) ||
			process.env.NEXT_PUBLIC_DEFAULT_PRODUCT_ID

		// To prevent double-purchasing, check if this user already has a
		// Purchase record for this product that is valid and wasn't a bulk
		// coupon purchase.

		const existingPurchases =
			await options.adapter.getExistingNonBulkValidPurchasesOfProduct({
				userId: user.id,
				productId,
			})

		if (existingPurchases.length > 0)
			throw new Error(`already-purchased-${email}`)

		const purchaseId = `purchase-${v4()}`

		await options.adapter.createPurchase({
			id: purchaseId,
			userId: user.id,
			couponId: bulkCouponRedemption ? null : coupon.id,
			redeemedBulkCouponId: bulkCouponRedemption ? coupon.id : null,
			productId: productId as string,
			totalAmount: '0',
			metadata: {
				couponUsedId: bulkCouponRedemption ? null : coupon.id,
			},
		})

		const createPurchase = await options.adapter.getPurchase(purchaseId)

		await options.adapter.incrementCouponUsedCount(coupon.id)

		await options.adapter.createPurchaseTransfer({
			sourceUserId: user.id,
			purchaseId: purchaseId,
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
		})

		// TODO: use a transaction for this

		// if it's redeemed for the current user we don't need to send a login email
		// if (redeemingForCurrentUser) {
		// 	// send an appropriate email
		// } else if (sendEmail && authOptions) {
		// 	await sendServerEmail({
		// 		email: user.email,
		// 		callbackUrl: `${process.env.NEXTAUTH_URL}/welcome?purchaseId=${purchase.id}`,
		// 		adapter: options.adapter,
		// 	})
		// }

		// Post to Slack to notify the team when a special-purpose coupon is
		// redeemed. Ignore redemption of bulk coupon.
		// if (params.options.slack?.redeem && !bulkCouponRedemption) {
		// 	await postRedemptionToSlack(
		// 		user.email,
		// 		purchase.productId,
		// 		params.options.slack,
		// 	)
		// }

		return {
			body: { purchase: createPurchase, redeemingForCurrentUser },
			headers: { 'Content-Type': 'application/json' },
			cookies,
		}
	} else {
		throw new Error(`coupon-is-invalid-${couponId}`)
	}
}
