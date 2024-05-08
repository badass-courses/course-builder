import { CourseBuilderConfig } from '../index'
import { RequestInternal, ResponseInternal } from '../types'
import * as actions from './actions'
import { getPricesFormatted } from './actions/prices-formatted'
import { redeem } from './actions/redeem'
import { init } from './init'
import { UnknownAction } from './utils/web'

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
		}
	} else {
		switch (action) {
			case 'prices-formatted':
				return await getPricesFormatted(request, cookies, options)
			case 'redeem':
				return await redeem(request, cookies, options)
			case 'checkout':
				return await actions.checkout(request, cookies, options)
			case 'webhook':
				return await actions.webhook(request, cookies, options)
			case 'subscribe-to-list':
				return await actions.subscribeToList(request, cookies, options)
		}
	}

	throw new UnknownAction(`Cannot handle action: ${action}`)
}
