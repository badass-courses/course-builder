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
		const stripeChargeId =
			(request.query?.stripeChargeId as string) ||
			(request.body?.stripeChargeId as string)

		if (!stripeChargeId) throw new Error('No stripe charge id')

		console.log('refunding purchase for:', stripeChargeId)

		// we're receiving a Stripe charge ID, do directly refund
		const refund = options.provider.refundCharge(stripeChargeId)

		try {
			await options.inngest.send({
				name: REFUND_PROCESSED_EVENT,
				data: {
					stripeChargeId: stripeChargeId,
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
