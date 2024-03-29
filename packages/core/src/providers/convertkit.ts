import { find, isEmpty } from 'lodash'

import { Cookie } from '../lib/utils/cookie'
import {
	EmailListConfig,
	EmailListConsumerConfig,
	EmailListSubscribeOptions,
} from './index'

export default function ConvertkitProvider(
	options: EmailListConsumerConfig,
): EmailListConfig {
	return {
		id: 'convertkit',
		name: 'Convertkit',
		type: 'email-list',
		defaultListType: 'form',
		options,
		apiKey: options.apiKey,
		apiSecret: options.apiSecret,
		subscribeToList: async (subscribeOptions: EmailListSubscribeOptions) => {
			const { listId, user, listType, fields } = subscribeOptions

			if (!listId) {
				throw new Error('No listId provided')
			}

			const getEndpoint = () => {
				switch (listType) {
					case 'form':
						return `/forms/${listId}/subscribe`
					case 'sequence':
						return `/sequences/${listId}/subscribe`
					case 'tag':
						return `/tags/${listId}/subscribe`
				}
			}

			const subscriber = await subscribeToEndpoint({
				endPoint: getEndpoint(),
				params: {
					email: user.email,
					first_name: user.name,
					fields: subscribeOptions.fields,
				},
				convertkitApiKey: options.apiKey,
			})

			const fullSubscriber = await fetchSubscriber({
				convertkitId: subscriber.id.toString(),
				convertkitApiKey: options.apiKey,
				convertkitApiSecret: options.apiSecret,
			})

			const fullSubscriberWithoutEmptyFields = filterNullFields(fullSubscriber)

			if (fields) {
				await setConvertkitSubscriberFields({
					fields,
					subscriber: fullSubscriber,
					convertkitApiSecret: options.apiSecret,
					convertkitApiKey: options.apiKey,
				})
			}

			return await fetchSubscriber({
				convertkitId: subscriber.id.toString(),
				convertkitApiKey: options.apiKey,
				convertkitApiSecret: options.apiSecret,
			})
		},
	}
}

const hour = 3600000
export const oneYear = 365 * 24 * hour

export function getConvertkitSubscriberCookie(subscriber: any): Cookie[] {
	return [
		{
			name: 'ck_subscriber',
			value: JSON.stringify(subscriber),
			options: {
				secure: process.env.NODE_ENV === 'production',
				httpOnly: true,
				path: '/',
				maxAge: oneYear,
			},
		},
		{
			name:
				process.env.NEXT_PUBLIC_CONVERTKIT_SUBSCRIBER_KEY || 'ck_subscriber_id',
			value: subscriber.id,
			options: {
				secure: process.env.NODE_ENV === 'production',
				httpOnly: true,
				path: '/',
				maxAge: 31556952,
			},
		},
	]
}

type Subscriber = Record<string, any>

export function filterNullFields(obj: Subscriber): Subscriber {
	const filteredObj: Subscriber = {}

	for (const key in obj) {
		if (obj[key] !== null) {
			if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
				filteredObj[key] = filterNullFields(obj[key] as Subscriber) // Recursively filter nested objects
			} else {
				filteredObj[key] = obj[key]
			}
		}
	}

	return filteredObj
}

const convertkitBaseUrl = 'https://api.convertkit.com/v3/'

export async function subscribeToEndpoint({
	endPoint,
	params,
	convertkitApiKey,
}: {
	endPoint: string
	params: Record<string, any>
	convertkitApiKey: string
}) {
	return await fetch(`${convertkitBaseUrl}${endPoint}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
		},
		body: JSON.stringify({
			...params,
			api_key: convertkitApiKey,
		}),
	})
		.then((res) => res.json())
		.then(
			({ subscription }: { subscription: { subscriber: { id: number } } }) => {
				return subscription.subscriber
			},
		)
		.catch((error) => {
			console.error(error)
			throw error
		})
}

async function fetchSubscriber({
	convertkitId,
	convertkitApiSecret,
	convertkitApiKey,
}: {
	convertkitId: string | number
	convertkitApiSecret: string
	convertkitApiKey: string
}) {
	let subscriber

	if (convertkitId) {
		const subscriberUrl = `${convertkitBaseUrl}/subscribers/${convertkitId}?api_secret=${convertkitApiSecret}`
		subscriber = await fetch(subscriberUrl)
			.then((res) => res.json())
			.then(({ subscriber }: any) => {
				return subscriber
			})
	}

	if (isEmpty(subscriber)) return

	const tagsApiUrl = `${convertkitBaseUrl}/subscribers/${subscriber.id}/tags?api_key=${convertkitApiKey}`
	const tags = await fetch(tagsApiUrl).then((res) => res.json())

	return { ...subscriber, tags }
}

export async function setConvertkitSubscriberFields({
	fields,
	subscriber,
	convertkitApiSecret,
	convertkitApiKey,
}: {
	subscriber: { id: string | number; fields: Record<string, string | null> }
	fields: Record<string, string>
	convertkitApiSecret: string
	convertkitApiKey: string
}) {
	for (const field in fields) {
		await createConvertkitCustomField({
			customField: field,
			subscriberId: subscriber.id.toString(),
			convertkitApiSecret,
			convertkitApiKey,
		})
	}
	return await fetch(`${convertkitBaseUrl}/subscribers/${subscriber.id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
		},
		body: JSON.stringify({
			api_secret: process.env.CONVERTKIT_API_SECRET,
			fields,
		}),
	})
}

export async function createConvertkitCustomField({
	customField,
	subscriberId,
	convertkitApiSecret,
	convertkitApiKey,
}: {
	convertkitApiSecret: string
	convertkitApiKey: string
	customField: string
	subscriberId: string
}) {
	try {
		if (!process.env.CONVERTKIT_API_SECRET) {
			console.warn('set CONVERTKIT_API_SECRET')
			return
		}

		const subscriber = await fetchSubscriber({
			convertkitId: subscriberId,
			convertkitApiSecret,
			convertkitApiKey,
		})

		const fieldExists =
			subscriber?.fields &&
			!isEmpty(
				find(Object.keys(subscriber.fields), (field) => field === customField),
			)

		if (!fieldExists) {
			await fetch(`${convertkitBaseUrl}/custom_fields`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json; charset=utf-8',
				},
				body: JSON.stringify({
					api_secret: process.env.CONVERTKIT_API_SECRET,
					label: customField,
				}),
			})
		}
	} catch (e) {
		console.log({ e })
		console.debug(`convertkit field not created: ${customField}`)
	}
}
