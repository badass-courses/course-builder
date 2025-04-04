import { AIOutput } from '../../types'

export const STREAM_COMPLETE = `\\ok`

/**
 * This is a streaming chunk publisher that will publish a message to the partykit server as a
 * series of websocket messages that can be handled anywhere in the system to perform additional
 * work.
 */
export class OpenAIStreamingDataPartykitChunkPublisher {
	requestId: string

	interval = 250

	buffer: {
		contents: string
		// signal is a blocking signal which resolves when the buffer has been written.
		signal?: Promise<unknown>
	}

	partyUrl: string

	constructor(requestId: string, partyUrlBase: string) {
		this.requestId = requestId
		this.buffer = {
			contents: '',
		}

		this.partyUrl = `${partyUrlBase}/party/${requestId}`
	}

	async publishMessage(message: string) {
		await publishToPartykit(message, this.requestId, this.partyUrl)
	}

	async writeResponseInChunks(
		stream: ReadableStream<Uint8Array>,
	): Promise<AIOutput> {
		const applyChunk = this.appendToBufferAndPublish.bind(this)

		const transformStream = new TransformStream({
			async transform(chunk, controller) {
				const text = new TextDecoder().decode(chunk)
				await applyChunk(text)
				controller.enqueue(chunk)
			},
		})

		// Directly pipe the input stream through the transform stream
		const transformedStream = stream.pipeThrough(transformStream)
		const result = await parseStreamToText(transformedStream, this.requestId)
		await this.buffer.signal
		return result
	}

	async appendToBufferAndPublish(text: string) {
		let resolve = (_val?: any) => {}

		this.buffer.contents += text

		if (this.buffer.signal) {
			// Already enqueued.
			return
		}

		this.buffer.signal = new Promise((r) => {
			resolve = r
		})
		setTimeout(() => {
			if (this.buffer.contents.length === 0) {
				// No need to write
				resolve()
				return
			}
			publishToPartykit(this.buffer.contents, this.requestId, this.partyUrl)
			resolve()
			this.buffer = {
				contents: '',
			}
		}, this.interval)
	}
}

/**
 * 🥳 Publish a message to the party. Sends a POST request to the partykit server. The server then
 * broadcasts it to all connected clients.
 *
 * @param body
 * @param requestId
 */
export const publishToPartykit = async (
	body: string,
	requestId: string,
	partyUrl: string,
) => {
	return await fetch(partyUrl, {
		method: 'POST',
		body: JSON.stringify({
			body,
			requestId,
			name: 'ai.message',
		}),
	}).catch((e) => {
		console.error(e)
	})
}

const parseStreamToText = async (
	stream: ReadableStream,
	requestId: string,
): Promise<AIOutput> => {
	const reader = stream.getReader()
	let text = ''
	let done, value
	while (!done) {
		;({ done, value } = await reader.read())
		if (value) {
			text += new TextDecoder().decode(value)
		}
	}
	return { role: 'assistant', content: text }
}
