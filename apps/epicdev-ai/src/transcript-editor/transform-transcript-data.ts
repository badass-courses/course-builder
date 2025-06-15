import {
	Alternative,
	Channel,
	DeepgramResponse,
	Paragraph,
	Sentence,
} from './transcript-deepgram-response'

/**
 * Transforms transcript data to match the expected schema format
 * Combines sentences text to create paragraph text where needed
 */
export function transformTranscriptData(
	data: DeepgramResponse,
): DeepgramResponse {
	const transformed = structuredClone(data)

	transformed.deepgramResults.channels.forEach((channel: Channel) => {
		channel.alternatives.forEach((alt: Alternative) => {
			if (alt.paragraphs) {
				// Transform paragraphs to match new schema
				alt.paragraphs.paragraphs = alt.paragraphs.paragraphs.map(
					(paragraph: Paragraph) => {
						// Combine sentences text to create paragraph text
						const text = paragraph.sentences
							.map((s: Sentence) => s.text)
							.join(' ')

						return {
							text,
							sentences: paragraph.sentences,
						}
					},
				)
			}
		})
	})

	return transformed
}
