import qs from 'query-string'

import { Subscriber } from '@coursebuilder/core/schemas/subscriber-schema'

export const redirectUrlBuilder = (
	subscriber: Subscriber,
	path: string,
	queryParams?: {
		[key: string]: string
	},
) => {
	const url = qs.stringifyUrl({
		url: path,
		query: {
			ck_subscriber_id: subscriber.id,
			email: subscriber.email_address,
			...queryParams,
		},
	})
	return url
}
