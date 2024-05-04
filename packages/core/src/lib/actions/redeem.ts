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
	console.log('💰 redeem')

	if (!options.adapter) throw new Error('Adapter not found')

	console.log('adapter found!')

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

	console.log('basemail!')

	const currentUser = options.getCurrentUser
		? await options.getCurrentUser()
		: null

	console.log('currentUser', currentUser)

	const createdPurchase = await options.adapter.redeemFullPriceCoupon({
		email: baseEmail,
		couponId,
		productIds,
		currentUserId: currentUser?.id,
		redeemingProductId: productIds?.[0],
	})

	console.log('createdPurchase', createdPurchase)

	if (createdPurchase) {
		const { purchase, redeemingForCurrentUser } = createdPurchase

		// if it's redeemed for the current user we don't need to send a login email
		if (redeemingForCurrentUser) {
			// send an appropriate email
		} else if (purchase?.userId && sendEmail) {
			const user = await options.adapter.getUserById(purchase.userId)
			if (!user) throw new Error(`unable-to-find-user-with-id-${purchase.id}`)
			const emailProvider = options.providers.find((p) => p.type === 'email')

			console.log('emailProvider', emailProvider)
			console.log('options', options)

			try {
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
			} catch (e) {
				console.log('error', e)
				throw new Error('unable-to-send-email')
			}
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
