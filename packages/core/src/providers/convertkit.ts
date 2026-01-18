import { z } from 'zod'

import { find, isEmpty } from '@coursebuilder/nodash'

import { Cookie } from '../lib/utils/cookie'
import { CookieOption } from '../types'
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
		tagSubscriber: async ({
			tag,
			subscriberId,
		}: {
			tag: string
			subscriberId: string
		}) => {
			const subscriber = await fetchSubscriber({
				convertkitId: subscriberId,
				convertkitApiSecret: options.apiSecret,
				convertkitApiKey: options.apiKey,
			})
		},
		getSubscriberByEmail: async (email: string) => {
			console.log({ email })
			if (!email) return null
			return await fetchSubscriber({
				subscriberEmail: email,
				convertkitApiSecret: options.apiSecret,
				convertkitApiKey: options.apiKey,
			})
		},
		getSubscriber: async (subscriberId: string | null | CookieOption) => {
			if (!subscriberId) return null
			return await fetchSubscriber({
				convertkitId: subscriberId,
				convertkitApiSecret: options.apiSecret,
				convertkitApiKey: options.apiKey,
			})
		},
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
		async updateSubscriberFields({
			subscriberId,
			subscriberEmail,
			fields,
		}: {
			subscriberId?: string
			subscriberEmail?: string
			fields: Record<string, any>
		}) {
			const subscriber = await fetchSubscriber({
				convertkitId: subscriberId,
				subscriberEmail,
				convertkitApiKey: options.apiKey,
				convertkitApiSecret: options.apiSecret,
			})

			await setConvertkitSubscriberFields({
				subscriber,
				fields,
				convertkitApiKey: options.apiKey,
				convertkitApiSecret: options.apiSecret,
			})

			return await fetchSubscriber({
				convertkitId: subscriberId,
				subscriberEmail,
				convertkitApiKey: options.apiKey,
				convertkitApiSecret: options.apiSecret,
			})
		},
	}
}

const hour = 3600000
export const oneYear = 365 * 24 * hour

const TagSubscriberResponseSchema = z.object({
	subscription: z.object({
		subscriber: z.object({
			id: z.string(),
			fields: z.record(z.string().nullable()).optional(),
		}),
	}),
})

async function createConvertkitTag({
	name,
	convertkitApiSecret,
}: {
	name: string
	convertkitApiSecret: string
}) {
	try {
		const response = await fetch(`${convertkitBaseUrl}/tags`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
			},
			body: JSON.stringify({
				api_secret: convertkitApiSecret,
				name,
			}),
		})

		if (!response.ok) {
			console.error(`Failed to create tag: ${response.statusText}`)
			return null
		}

		const data = await response.json()
		console.log('Tag created successfully')
		return data
	} catch (error) {
		console.error('Error creating tag:', error)
		return null
	}
}

async function tagSubscriber({
	email,
	tagId,
	convertkitApiKey,
}: {
	email: string
	tagId: string
	convertkitApiKey: string
}) {
	const url = `${convertkitBaseUrl}/tags/${tagId}/subscribe`
	return await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
		},
		body: JSON.stringify({
			email,
			api_key: convertkitApiKey,
		}),
	})
		.then((res) => res.json())
		.then((jsonRes: any) => {
			const result = TagSubscriberResponseSchema.safeParse(jsonRes)
			if (!result.success) {
				return undefined
			}
			return result.data.subscription.subscriber
		})
}

export function getConvertkitSubscriberCookie(subscriber: any): Cookie[] {
	return subscriber
		? [
				{
					name: 'ck_subscriber',
					value: JSON.stringify(subscriber),
					options: {
						secure: true,
						httpOnly: true,
						path: '/',
						maxAge: oneYear,
						sameSite: 'lax',
					},
				},
				{
					name:
						process.env.NEXT_PUBLIC_CONVERTKIT_SUBSCRIBER_KEY ||
						'ck_subscriber_id',
					value: subscriber.id,
					options: {
						secure: true,
						httpOnly: true,
						path: '/',
						maxAge: 31556952,
						sameSite: 'lax',
					},
				},
			]
		: []
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
	endPoint?: string
	params: Record<string, any>
	convertkitApiKey: string
}) {
	if (!endPoint) {
		throw new Error('No endPoint provided')
	}
	const response = await fetch(`${convertkitBaseUrl}${endPoint}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
		},
		body: JSON.stringify({
			...params,
			api_key: convertkitApiKey,
		}),
	})

	const data = await response.json()

	if (!response.ok) {
		const errorMessage = data?.error || data?.message || 'ConvertKit API error'
		throw new Error(`ConvertKit subscription failed: ${errorMessage}`)
	}

	if (!data?.subscription?.subscriber) {
		throw new Error(
			`Unexpected ConvertKit response structure: ${JSON.stringify(data)}`,
		)
	}

	return data.subscription.subscriber
}

async function fetchSubscriber({
	convertkitId,
	convertkitApiSecret,
	convertkitApiKey,
	subscriberEmail,
}: {
	convertkitId?: string | number | CookieOption
	subscriberEmail?: string
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

	if (!subscriber && subscriberEmail) {
		const tagsApiUrl = `${convertkitBaseUrl}subscribers?api_secret=${convertkitApiSecret}&email_address=${subscriberEmail.trim().toLowerCase()}`
		console.log({ tagsApiUrl })
		subscriber = await fetch(tagsApiUrl)
			.then((res) => res.json())
			.then((res: any) => {
				const subscribers = res.subscribers
				return subscribers[0]
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
			api_secret: convertkitApiSecret,
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
					api_secret: convertkitApiSecret,
					label: customField,
				}),
			})
		}
	} catch (e) {
		console.log({ e })
		console.debug(`convertkit field not created: ${customField}`)
	}
}
