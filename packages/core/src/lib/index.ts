import { CourseBuilderConfig } from '../index'
import { RequestInternal, ResponseInternal } from '../types'
import * as actions from './actions'
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

	console.log({ action, providerId, error, method })

	if (method === 'GET') {
		switch (action) {
			case 'srt':
				return await actions.srt(request, cookies, options)
			case 'session':
				return await actions.session(options, cookies)
		}
	} else {
		switch (action) {
			case 'checkout':
				const checkout = await actions.checkout(request, cookies, options)
				console.log({ checkout })
				return checkout
			case 'webhook':
				return await actions.webhook(request, cookies, options)
			case 'subscribe-to-list':
				return await actions.subscribeToList(request, cookies, options)
		}
	}

	throw new UnknownAction(`Cannot handle action: ${action}`)
}
