import { NodemailerConfig } from '@auth/core/providers/nodemailer'
import { z } from 'zod'

import { InternalOptions, RequestInternal, ResponseInternal } from '../../types'
import { sendServerEmail } from '../send-server-email'
import { Cookie } from '../utils/cookie'

export async function redeem(
	request: RequestInternal,
	cookies: Cookie[],
	options: InternalOptions,
): Promise<ResponseInternal> {
	if (!options.adapter) throw new Error('Adapter not found')

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

	if (!baseEmail) throw new Error(`invalid-email-${baseEmail}`)

	const currentUser = options.getCurrentUser
		? await options.getCurrentUser()
		: null

	const createdPurchase = await options.adapter.redeemFullPriceCoupon({
		email: baseEmail,
		couponId,
		productIds,
		currentUserId: currentUser?.id,
		redeemingProductId: process.env.NEXT_PUBLIC_DEFAULT_PRODUCT_ID,
	})

	if (createdPurchase) {
		const { purchase, redeemingForCurrentUser } = createdPurchase

		// if it's redeemed for the current user we don't need to send a login email
		if (redeemingForCurrentUser) {
			// send an appropriate email
		} else if (purchase?.userId && sendEmail) {
			const user = await options.adapter.getUserById(purchase.userId)
			if (!user) throw new Error(`unable-to-find-user-with-id-${purchase.id}`)
			const emailProvider = options.providers.find((p) => p.type === 'email')
			await sendServerEmail({
				email: user.email as string,
				baseUrl: options.baseUrl,
				callbackUrl: `${options.baseUrl}/welcome?purchaseId=${purchase.id}`,
				adapter: options.adapter,
				authOptions: options.authConfig,
				emailProvider: emailProvider
					? (emailProvider as NodemailerConfig)
					: undefined,
			})
		}

		// TODO: create Slack Provider
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
			body: { purchase, redeemingForCurrentUser },
			headers: { 'Content-Type': 'application/json' },
			cookies,
		}
	} else {
		throw new Error(`coupon-is-invalid-${couponId}`)
	}
}
