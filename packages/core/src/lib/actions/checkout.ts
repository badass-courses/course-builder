import { InternalOptions, RequestInternal, ResponseInternal } from '../../types'
import { CheckoutParamsSchema } from '../pricing/stripe-checkout'
import { Cookie } from '../utils/cookie'

export async function checkout(
	request: RequestInternal,
	cookies: Cookie[],
	options: InternalOptions<'payment'>,
): Promise<ResponseInternal> {
	const { callbacks, logger } = options

	const response: ResponseInternal<any | null> = {
		body: null,
		headers: { 'Content-Type': 'application/json' },
		cookies,
	}

	const checkoutParamsParsed = CheckoutParamsSchema.safeParse({
		...request.query,
		country:
			request.query?.country ||
			request.headers?.['x-vercel-ip-country'] ||
			process.env.DEFAULT_COUNTRY ||
			'US',
		ip_address:
			request.query?.ip_address ||
			request.headers?.['x-forwarded-for'] ||
			'0.0.0.0',
	})

	if (!checkoutParamsParsed.success) {
		console.error('Error parsing checkout params', checkoutParamsParsed)
		console.log({ error: JSON.stringify(checkoutParamsParsed.error.format()) })
		throw new Error('Error parsing checkout params')
	}

	const checkoutParams = checkoutParamsParsed.data

	try {
		const stripe = await options.provider.createCheckoutSession(
			checkoutParams,
			options.adapter,
		)

		return Response.redirect(stripe.redirect)
	} catch (e) {
		logger.error(e as Error)
	}

	return response
}
