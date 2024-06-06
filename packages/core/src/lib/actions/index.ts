import { z } from 'zod'

import { VIDEO_SRT_READY_EVENT } from '../../inngest/video-processing/events/event-video-srt-ready-to-asset'
import {
	filterNullFields,
	getConvertkitSubscriberCookie,
} from '../../providers/convertkit'
import {
	srtFromTranscriptResult,
	transcriptAsParagraphsWithTimestamps,
	wordLevelSrtFromTranscriptResult,
} from '../../providers/deepgram'
import { InternalOptions, RequestInternal, ResponseInternal } from '../../types'
import { processStripeWebhook } from '../pricing/process-stripe-webhook'
import { CheckoutParamsSchema } from '../pricing/stripe-checkout'
import { Cookie } from '../utils/cookie'

export async function getSubscriber(
	options: InternalOptions<'email-list'>,
	cookies: Cookie[],
): Promise<ResponseInternal<any | null>> {
	switch (options.provider.type) {
		case 'email-list':
			const subscriber = await options.provider.getSubscriber(
				options.url.searchParams.get('subscriberId'),
			)
			if (subscriber?.id) {
				cookies.push({
					name: 'ck_subscriber_id',
					value: subscriber.id.toString(),
					options: {
						path: '/',
						httpOnly: true,
						sameSite: 'lax',
						maxAge: 31556952,
						secure: process.env.NODE_ENV === 'production',
					},
				})
			}
			return {
				status: 200,
				body: subscriber,
				headers: { 'Content-Type': 'application/json' },
				cookies: getConvertkitSubscriberCookie(subscriber),
			}
		default:
			throw new Error('Unsupported provider')
	}
}

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

	const checkoutParamsParsed = CheckoutParamsSchema.safeParse(request.query)

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

export async function webhook(
	request: RequestInternal,
	cookies: Cookie[],
	options: InternalOptions<'transcription' | 'payment'>,
): Promise<ResponseInternal> {
	if (!options.provider) throw new Error('Provider not found')

	switch (options.provider.type) {
		case 'payment':
			if (options.provider.id === 'stripe') {
				await processStripeWebhook(request.body, options)
				return Response.json('ok', { status: 200 })
			} else {
				throw new Error('Unsupported provider')
			}

		case 'transcription':
			if (!request.body) throw new Error('No body')

			const { results } = request.body

			const videoResourceId = options.url.searchParams.get('videoResourceId')

			const srt = srtFromTranscriptResult(results)
			const wordLevelSrt = wordLevelSrtFromTranscriptResult(results)
			const transcript = transcriptAsParagraphsWithTimestamps(results)

			await options.adapter?.updateContentResourceFields({
				id: videoResourceId as string,
				fields: {
					transcript,
					srt,
					wordLevelSrt,
				},
			})

			await options.inngest.send({
				name: 'video/transcript-ready-event',
				data: {
					videoResourceId,
				},
			})

			if (srt && wordLevelSrt && videoResourceId) {
				await options.inngest.send({
					name: VIDEO_SRT_READY_EVENT,
					data: {
						videoResourceId: videoResourceId,
					},
				})
			}
			return {
				status: 200,
				body: null,
				headers: { 'Content-Type': 'application/json' },
				cookies,
			}
	}

	throw new Error('Invalid provider type')
}
