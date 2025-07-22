import { REFUND_PROCESSED_EVENT } from 'src/inngest/commerce/event-refund-processed'

import { InternalOptions, RequestInternal, ResponseInternal } from '../../types'
import { Cookie } from '../utils/cookie'

export async function processRefund(
	request: RequestInternal,
	cookies: Cookie[],
	options: InternalOptions<'payment'>,
): Promise<ResponseInternal> {
	if (!options.adapter) throw new Error('Adapter not found')
	if (request.headers?.['x-skill-secret'] !== process.env.SKILL_SECRET) {
		return { status: 401, body: 'unauthorized' }
	}

	try {
		const merchantChargeId =
			(request.query?.merchantChargeId as string) ||
			(request.body?.merchantChargeId as string)

		const stripeChargeId =
			(request.query?.stripeChargeId as string) ||
			(request.body?.stripeChargeId as string)

		// Prefer stripeChargeId if provided, else look up from merchantChargeId
		let finalStripeChargeId = stripeChargeId
		let finalMerchantChargeId = merchantChargeId

		if (!finalStripeChargeId && merchantChargeId && options.adapter) {
			// Look up the merchant charge to get the Stripe charge ID
			const merchantCharge =
				await options.adapter.getMerchantCharge(merchantChargeId)
			if (merchantCharge?.identifier) {
				finalStripeChargeId = merchantCharge.identifier
			}
		}

		// If neither is available, throw
		if (!finalStripeChargeId) throw new Error('No stripe charge id')

		console.log('refunding purchase for:', finalStripeChargeId)

		// Always refund using the Stripe charge ID
		const refund = await options.provider.refundCharge(finalStripeChargeId)

		try {
			await options.inngest.send({
				name: REFUND_PROCESSED_EVENT,
				data: {
					merchantChargeId: finalMerchantChargeId, // old, for compatibility
					stripeChargeId: finalStripeChargeId, // new, always a Stripe charge ID
				},
			})
		} catch (e) {
			console.log('error', e)
		}

		return {
			status: 200,
			body: JSON.stringify(refund),
		}
	} catch (e) {
		console.log('error', e)
		throw new Error('unable-to-lookup-user')
	}
}
