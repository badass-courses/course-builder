import { NodemailerConfig } from '@auth/core/providers/nodemailer'
import { z } from 'zod'

import { VIDEO_SRT_READY_EVENT } from '../../inngest/video-processing/events/event-video-srt-ready-to-asset'
import { VIDEO_TRANSCRIPT_READY_EVENT } from '../../inngest/video-processing/events/event-video-transcript-ready'
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
import { sendServerEmail } from '../send-server-email'
import { Cookie } from '../utils/cookie'

export async function getUserPurchases(
	request: RequestInternal,
	cookies: Cookie[],
	options: InternalOptions,
): Promise<ResponseInternal> {
	const client = options.adapter

	if (!request.query?.userId)
		return {
			status: 200,
			body: [],
			headers: { 'Content-Type': 'application/json' },
			cookies,
		}

	const purchases = await client?.getPurchasesForUser(request.query.userId)

	if (!purchases) {
		return {
			status: 200,
			body: [],
			headers: { 'Content-Type': 'application/json' },
			cookies,
		}
	} else {
		return {
			status: 200,
			body: purchases,
			headers: { 'Content-Type': 'application/json' },
			cookies,
		}
	}
}

export async function getSubscriber(
	options: InternalOptions<'email-list'>,
	cookies: Cookie[],
): Promise<ResponseInternal<any | null>> {
	switch (options.provider.type) {
		case 'email-list':
			const subscriber = await options.provider.getSubscriber(
				options.url.searchParams.get('subscriberId') ||
					options.cookies.ck_subscriber_id ||
					null,
			)
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
					listType: z.string().optional(),
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

			if (!user.emailVerified) {
				const emailProvider = options.providers.find(
					(p) => p.type === 'email',
				) as NodemailerConfig

				if (
					emailProvider &&
					options.adapter &&
					options.provider.id === 'coursebuilder'
				) {
					await sendServerEmail({
						email: user.email,
						type: 'signup',
						callbackUrl: `${options.baseUrl}/confirmed`,
						emailProvider,
						authOptions: options.authConfig,
						adapter: options.adapter,
						baseUrl: options.baseUrl,
					})
				}
			}
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

			if (!videoResourceId) throw new Error('No videoResourceId')

			const videoResource =
				await options.adapter?.getContentResource(videoResourceId)

			if (!videoResource) throw new Error('No videoResource')

			const rawTranscriptId = `raw-transcript-${videoResourceId}`

			const existingRawTranscript =
				await options.adapter?.getContentResource(rawTranscriptId)

			if (!existingRawTranscript) {
				await options.adapter?.createContentResource({
					id: rawTranscriptId,
					type: 'raw-transcript',
					fields: {
						deepgramResults: results,
					},
					createdById: videoResource.createdById,
				})
				await options.adapter?.addResourceToResource({
					childResourceId: rawTranscriptId,
					parentResourceId: videoResourceId,
				})
			}

			const srt = srtFromTranscriptResult(results)
			const wordLevelSrt = wordLevelSrtFromTranscriptResult(results)
			const transcript = transcriptAsParagraphsWithTimestamps(results)

			// await options.adapter?.createContentResource({
			// 	id: `raw-transcript-${videoResourceId}`,
			// 	type: 'raw-transcript',
			// 	fields: {
			// 		rawTranscript: results,
			// 	},
			// 	createdById: videoResource.createdById,
			// })
			//
			// await options.adapter?.addResourceToResource({
			// 	childResourceId: `transcript-${videoResourceId}`,
			// 	parentResourceId: videoResourceId,
			// })
			//
			// await options.adapter?.createContentResource({
			// 	id: `transcript-${videoResourceId}`,
			// 	type: 'transcript',
			// 	fields: {
			// 		transcript,
			// 	},
			// 	createdById: videoResource.createdById,
			// })
			//
			// await options.adapter?.addResourceToResource({
			// 	childResourceId: `transcript-${videoResourceId}`,
			// 	parentResourceId: videoResourceId,
			// })
			//
			// await options.adapter?.createContentResource({
			// 	id: `srt-${videoResourceId}`,
			// 	type: 'srt',
			// 	fields: {
			// 		srt,
			// 	},
			// 	createdById: videoResource.createdById,
			// })
			//
			// await options.adapter?.addResourceToResource({
			// 	childResourceId: `srt-${videoResourceId}`,
			// 	parentResourceId: videoResourceId,
			// })
			//
			// await options.adapter?.createContentResource({
			// 	id: `word-level-srt-${videoResourceId}`,
			// 	type: 'word-level-srt',
			// 	fields: {
			// 		wordLevelSrt,
			// 	},
			// 	createdById: videoResource.createdById,
			// })
			//
			// await options.adapter?.addResourceToResource({
			// 	childResourceId: `word-level-srt-${videoResourceId}`,
			// 	parentResourceId: videoResourceId,
			// })

			await options.adapter?.updateContentResourceFields({
				id: videoResourceId as string,
				fields: {
					transcript,
					srt,
					wordLevelSrt,
				},
			})

			await options.inngest.send({
				name: VIDEO_TRANSCRIPT_READY_EVENT,
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
