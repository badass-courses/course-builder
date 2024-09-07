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

		if (!merchantChargeId) throw new Error('No merchant charge id')

		console.log('refunding purchase for:', merchantChargeId)

		const merchantCharge =
			await options.adapter?.getMerchantCharge(merchantChargeId)

		let refund

		if (!merchantCharge) {
			refund = options.provider.refundCharge(merchantChargeId)
		} else {
			refund = options.provider.refundCharge(merchantCharge.identifier)
		}

		// internally we handle this via stripe webhook for a refund
		// so no need to do anything else here

		return {
			status: 200,
			body: JSON.stringify(refund),
		}
	} catch (e) {
		console.log('error', e)
		throw new Error('unable-to-lookup-user')
	}
}
