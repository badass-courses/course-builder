import { InternalOptions, RequestInternal, ResponseInternal } from '../../types'
import { Cookie } from '../utils/cookie'

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
	options: InternalOptions,
): Promise<ResponseInternal> {
	if (!options.provider) throw new Error('Provider not found')

	switch (options.provider.type) {
		case 'transcription':
			if (!request.body) throw new Error('No body')

			const { results } = request.body

			const { srt, transcript, wordLevelSrt } =
				options.provider.handleCallback(results)
			const videoResourceId = options.url.searchParams.get('videoResourceId')
			await options.inngest.send({
				name: 'video/transcript-ready-event',
				data: {
					videoResourceId,
					moduleSlug: options.url.searchParams.get('moduleSlug'),
					results,
					srt,
					wordLevelSrt,
					transcript,
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
