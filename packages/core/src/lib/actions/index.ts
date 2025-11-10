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
import { logger } from '../utils/logger'

export async function getUserPurchases(
	request: RequestInternal,
	cookies: Cookie[],
	options: InternalOptions,
): Promise<ResponseInternal> {
	const client = options.adapter

	const currentUser = await options.getCurrentUser?.()

	if (!currentUser?.id || currentUser.id !== request.query?.userId) {
		return {
			status: 401,
			body: [],
			headers: { 'Content-Type': 'application/json' },
			cookies,
		}
	}

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
				return {
					status: 200,
					body: 'ok',
					headers: { 'Content-Type': 'application/json' },
					cookies,
				}
			} else {
				throw new Error('Unsupported provider')
			}

		case 'transcription':
			try {
				logger.debug('Deepgram webhook received', {
					hasBody: !!request.body,
					videoResourceId: options.url.searchParams.get('videoResourceId'),
					createdById: options.url.searchParams.get('createdById'),
					url: options.url.toString(),
				})

				if (!request.body) {
					logger.error(new Error('Deepgram webhook: No body'))
					return {
						status: 200,
						body: { error: 'No body' },
						headers: { 'Content-Type': 'application/json' },
						cookies,
					}
				}

				const { results } = request.body

				if (!results) {
					logger.error(new Error('Deepgram webhook: No results in body'))
					return {
						status: 200,
						body: { error: 'No results in body' },
						headers: { 'Content-Type': 'application/json' },
						cookies,
					}
				}

				const videoResourceId = options.url.searchParams.get('videoResourceId')
				const createdByIdFromQuery = options.url.searchParams.get('createdById')

				logger.debug('Deepgram webhook processing', {
					videoResourceId,
					createdByIdFromQuery,
					hasResults: !!results,
				})

				if (!videoResourceId) {
					logger.error(new Error('Deepgram webhook: No videoResourceId'))
					return {
						status: 200,
						body: { error: 'No videoResourceId' },
						headers: { 'Content-Type': 'application/json' },
						cookies,
					}
				}

				const videoResource =
					await options.adapter?.getContentResource(videoResourceId)

				if (!videoResource) {
					logger.error(
						new Error(
							`Deepgram webhook: Video resource not found: ${videoResourceId}`,
						),
					)
					return {
						status: 200,
						body: { error: 'Video resource not found' },
						headers: { 'Content-Type': 'application/json' },
						cookies,
					}
				}

				// Use createdById from query param (passed from migration) or fall back to video resource
				const createdById = createdByIdFromQuery || videoResource.createdById

				// Ensure createdById exists - required for creating resources
				if (!createdById) {
					logger.error(
						new Error(
							`Deepgram webhook: Video resource ${videoResourceId} has no createdById`,
						),
					)
					return {
						status: 200,
						body: { error: 'Video resource missing createdById' },
						headers: { 'Content-Type': 'application/json' },
						cookies,
					}
				}

				// UPDATE RAW-TRANSCRIPT - It should already exist (created when video was created)
				const rawTranscriptId = `raw-transcript-${videoResourceId}`

				logger.debug('Checking for existing raw-transcript', {
					rawTranscriptId,
					videoResourceId,
				})

				const existingRawTranscript =
					await options.adapter?.getContentResource(rawTranscriptId)

				if (!existingRawTranscript) {
					logger.error(
						new Error(
							`Raw-transcript resource not found: ${rawTranscriptId}. It should have been created when the video resource was created.`,
						),
					)
					// Try to create it as a fallback, but this shouldn't happen
					try {
						const createdRawTranscript =
							await options.adapter?.createContentResource({
								id: rawTranscriptId,
								type: 'raw-transcript',
								fields: {
									deepgramResults: results,
								},
								createdById: createdById,
							})

						if (!createdRawTranscript) {
							throw new Error(
								'Failed to create raw-transcript resource - adapter returned null',
							)
						}

						await options.adapter?.addResourceToResource({
							childResourceId: rawTranscriptId,
							parentResourceId: videoResourceId,
						})

						logger.debug('Raw-transcript created as fallback', {
							rawTranscriptId: createdRawTranscript.id,
							videoResourceId,
						})
					} catch (error) {
						logger.error(
							new Error(
								`Failed to create raw-transcript resource as fallback: ${(error as Error).message}`,
								{ cause: error },
							),
						)
						// Continue anyway - we can still update the video resource with transcripts
					}
				} else {
					// Update the existing raw-transcript with Deepgram results
					logger.debug(
						'Updating existing raw-transcript with Deepgram results',
						{
							rawTranscriptId,
							videoResourceId,
						},
					)

					try {
						await options.adapter?.updateContentResourceFields({
							id: rawTranscriptId,
							fields: {
								deepgramResults: results,
							},
						})

						logger.debug('Raw-transcript updated successfully', {
							rawTranscriptId,
							videoResourceId,
						})
					} catch (error) {
						logger.error(
							new Error(
								`Failed to update raw-transcript resource: ${(error as Error).message}`,
								{ cause: error },
							),
						)
						// Continue anyway - we can still update the video resource with transcripts
					}
				}

				// Now process the transcripts - THIS IS CRITICAL - must always happen
				logger.debug('Processing transcript results', {
					videoResourceId,
					hasResults: !!results,
				})

				let srt: string | null = null
				let wordLevelSrt: string | null = null
				let transcript: string | null = null

				try {
					srt = srtFromTranscriptResult(results)
					wordLevelSrt = wordLevelSrtFromTranscriptResult(results)
					transcript = transcriptAsParagraphsWithTimestamps(results)

					logger.debug('Transcript processed successfully', {
						videoResourceId,
						hasTranscript: !!transcript,
						hasSrt: !!srt,
						hasWordLevelSrt: !!wordLevelSrt,
					})
				} catch (error) {
					logger.error(
						new Error(
							`Failed to process transcript results: ${(error as Error).message}`,
							{ cause: error },
						),
					)
					// Continue - we'll try to update with whatever we have
				}

				// Update video resource with processed transcripts - THIS MUST SUCCEED
				try {
					logger.debug('Updating video resource with transcripts', {
						videoResourceId,
						hasTranscript: !!transcript,
						hasSrt: !!srt,
						hasWordLevelSrt: !!wordLevelSrt,
					})

					await options.adapter?.updateContentResourceFields({
						id: videoResourceId as string,
						fields: {
							transcript: transcript || undefined,
							srt: srt || undefined,
							wordLevelSrt: wordLevelSrt || undefined,
						},
					})

					logger.debug('Video resource updated with transcripts successfully', {
						videoResourceId,
					})
				} catch (error) {
					logger.error(
						new Error(
							`CRITICAL: Failed to update video resource with transcripts: ${(error as Error).message}`,
							{ cause: error },
						),
					)
					// Don't throw - return success to Deepgram but log the error
				}

				// Send events
				try {
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
				} catch (error) {
					logger.error(
						new Error(
							`Failed to send transcript ready events: ${(error as Error).message}`,
							{ cause: error },
						),
					)
					// Don't fail the webhook - events are not critical
				}

				logger.debug('Deepgram webhook completed successfully', {
					videoResourceId,
				})

				return {
					status: 200,
					body: { success: true },
					headers: { 'Content-Type': 'application/json' },
					cookies,
				}
			} catch (error) {
				logger.error(error as Error)
				// Return 200 to Deepgram so it doesn't retry on transient errors
				// but log the error for debugging
				return {
					status: 200,
					body: { error: (error as Error).message },
					headers: { 'Content-Type': 'application/json' },
					cookies,
				}
			}
	}

	throw new Error('Invalid provider type')
}
