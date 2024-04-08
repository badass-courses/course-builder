import { z } from 'zod'

import {
	filterNullFields,
	getConvertkitSubscriberCookie,
} from '../../providers/convertkit'
import { InternalOptions, RequestInternal, ResponseInternal } from '../../types'
import { Cookie } from '../utils/cookie'

export async function subscribeToList(
	request: RequestInternal,
	cookies: Cookie[],
	options: InternalOptions<'email-list'>,
): Promise<ResponseInternal<any | null>> {
	const response: ResponseInternal<any | null> = {
		body: null,
		headers: { 'Content-Type': 'application/json' },
		cookies,
	}

	switch (options.provider.type) {
		case 'email-list':
			const subscribeOptions = z
				.object({
					listId: z.union([z.number(), z.string()]).optional(),
					listType: z.enum(['sequence', 'tag', 'form']).optional(),
					fields: z.record(z.string(), z.any()).optional().nullable(),
					email: z.string(),
					name: z.string().optional().nullable(),
				})
				.parse(request.body)

			let user = await options.adapter?.getUserByEmail(subscribeOptions.email)

			if (!user) {
				user = await options.adapter?.createUser({
					id: crypto.randomUUID(),
					email: subscribeOptions.email,
					name: subscribeOptions.name,
					emailVerified: null,
				})
				if (!user) throw new Error('Could not create user')
				options.logger.debug(`created user ${user.id}`)
			} else {
				options.logger.debug(`found user ${user.id}`)
			}

			response.body = await options.provider.subscribeToList({
				user,
				listId: subscribeOptions.listId || options.provider.defaultListId,
				fields: subscribeOptions.fields || {},
				listType: subscribeOptions.listType || options.provider.defaultListType,
			})

			response.cookies = getConvertkitSubscriberCookie(
				filterNullFields(response.body),
			)
	}

	return response
}

export async function session(
	options: InternalOptions,
	cookies: Cookie[],
): Promise<ResponseInternal<any | null>> {
	const { callbacks, logger } = options

	const response: ResponseInternal<any | null> = {
		body: null,
		headers: { 'Content-Type': 'application/json' },
		cookies,
	}

	try {
		response.body = await callbacks.session({})
	} catch (e) {
		logger.error(e as Error)
	}

	return response
}

export async function srt(
	request: RequestInternal,
	cookies: Cookie[],
	options: InternalOptions,
): Promise<ResponseInternal> {
	const client = options.adapter

	const resource = await client?.getContentResource(
		request.query?.videoResourceId,
	)

	if (!resource) throw new Error('Resource not found')

	return {
		status: 200,
		body: resource.fields?.srt,
		headers: { 'Content-Type': 'application/text' },
		cookies,
	}
}

export async function webhook(
	request: RequestInternal,
	cookies: Cookie[],
	options: InternalOptions<'transcription'>,
): Promise<ResponseInternal> {
	if (!options.provider) throw new Error('Provider not found')

	switch (options.provider.type) {
		case 'transcription':
			if (!request.body) throw new Error('No body')

			const { results } = request.body

			const videoResourceId = options.url.searchParams.get('videoResourceId')
			await options.inngest.send({
				name: 'video/transcript-ready-event',
				data: {
					videoResourceId,
					moduleSlug: options.url.searchParams.get('moduleSlug'),
					results,
				},
			})
			return {
				status: 200,
				body: null,
				headers: { 'Content-Type': 'application/json' },
				cookies,
			}
	}

	throw new Error('Invalid provider type')
}
