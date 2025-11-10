import { CourseBuilderConfig } from '../index'
import { RequestInternal, ResponseInternal } from '../types'
import * as actions from './actions'
import { checkout } from './actions/checkout'
import { claimed } from './actions/claimed'
import { createMagicLink } from './actions/create-magic-link'
import { getPricesFormatted } from './actions/prices-formatted'
import { processRefund } from './actions/process-refund'
import { redeem } from './actions/redeem'
import { transferPurchase } from './actions/transfer-purchase'
import { userLookup } from './actions/user-lookup'
import { init } from './init'
import { UnknownAction } from './utils/web'

/**
 * this is essentially a "router" for the coursebuilder api that
 * routes the request to the appropriate action based on the action
 * and providerId
 *
 * @param request
 * @param courseBuilderOptions
 * @returns
 */
export async function CourseBuilderInternal(
	request: RequestInternal,
	courseBuilderOptions: CourseBuilderConfig,
): Promise<ResponseInternal> {
	const { action, providerId, error, method } = request

	const { options, cookies } = await init({
		courseBuilderOptions,
		action,
		providerId,
		url: request.url,
		cookies: request.cookies,
		isPost: method === 'POST',
	})

	if (method === 'GET') {
		switch (action) {
			case 'srt':
				return await actions.srt(request, cookies, options)
			case 'session':
				return await actions.session(options, cookies)
			case 'subscriber':
				return await actions.getSubscriber(options, cookies)
			case 'purchases':
				return await actions.getUserPurchases(request, cookies, options)
			case 'webhook':
				// Allow GET for webhook testing/debugging, but return a helpful message
				return {
					status: 405,
					body: { error: 'Webhook endpoints require POST requests' },
					headers: { 'Content-Type': 'application/json' },
					cookies,
				}
		}
	} else {
		switch (action) {
			case 'prices-formatted':
				return await getPricesFormatted(request, cookies, options)
			case 'redeem':
				return await redeem(request, cookies, options)
			case 'refund':
				return await processRefund(request, cookies, options)
			case 'checkout':
				return await checkout(request, cookies, options)
			case 'claimed':
				return await claimed(request, cookies, options)
			case 'webhook':
				return await actions.webhook(request, cookies, options)
			case 'subscribe-to-list':
				return await actions.subscribeToList(request, cookies, options)
			case 'lookup':
				return await userLookup(request, cookies, options)
			case 'create-magic-link':
				return await createMagicLink(request, cookies, options)
			case 'transfer':
				return await transferPurchase(request, cookies, options)
		}
	}

	throw new UnknownAction(`Cannot handle action: ${action}`)
}
