import { Subscriber } from '@/pricing/subscriber-schema'
import qs from 'query-string'

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
