/**
 * @module providers/deepgram
 */

import { z } from 'zod'

import type { TranscriptionConfig, TranscriptionUserConfig } from './index.js'

/** The returned transcription result from Deepgram when using the callback. */
export interface DeepgramTranscriptionResult extends Record<string, any> {
	srt: string
	transcript: string
	wordLevelSrt: string
}

const defaultGetCallbackUrl = ({
	baseUrl,
	params,
}: {
	baseUrl: string
	params: Record<string, string>
}) => {
	const callbackParams = new URLSearchParams(params)
	return `${baseUrl}?${callbackParams.toString()}`
}

export default function Deepgram(
	options: TranscriptionUserConfig,
): TranscriptionConfig {
	return {
		id: 'deepgram' as const,
		name: 'Deepgram',
		type: 'transcription',
		callbackUrl: options.callbackUrl,
		apiKey: options.apiKey,
		// Additional configuration options can be added here based on Deepgram's API requirements
		options,
		// Define how to initiate a transcription request to Deepgram
		initiateTranscription: async (transcriptOptions: {
			mediaUrl: string
			resourceId: string
		}) => {
			const deepgramUrl = `https://api.deepgram.com/v1/listen`

			const getCallbackUrl = options.getCallbackUrl || defaultGetCallbackUrl
			const utteranceSpiltThreshold = 0.5

			// just weird URL differences between dev and prod

			const deepgramParams = new URLSearchParams({
				model: 'whisper-large',
				punctuate: 'true',
				paragraphs: 'true',
				utterances: 'true',
				utt_split: String(utteranceSpiltThreshold),
				callback: getCallbackUrl({
					baseUrl: `${options.callbackUrl}`,
					params: { videoResourceId: transcriptOptions.resourceId },
				}),
			})

			const deepgramResponse = await fetch(
				`${deepgramUrl}?${deepgramParams.toString()}`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Token ${options.apiKey}`,
					},
					body: JSON.stringify({
						url: transcriptOptions.mediaUrl,
					}),
				},
			)

			// Handle HTTP errors with detailed logging
			if (!deepgramResponse.ok) {
				const errorBody = await deepgramResponse
					.text()
					.catch(() => 'Unable to read error body')

				const errorDetails = {
					status: deepgramResponse.status,
					statusText: deepgramResponse.statusText,
					resourceId: transcriptOptions.resourceId,
					mediaUrl: transcriptOptions.mediaUrl,
					errorBody,
				}

				if (deepgramResponse.status === 429) {
					console.error(
						'[Deepgram] RATE LIMITED (429) - Too many requests',
						errorDetails,
					)
					throw new Error(
						`Deepgram rate limited (429): Too many requests. ` +
							`Resource: ${transcriptOptions.resourceId}. ` +
							`Try again later or reduce request frequency.`,
					)
				}

				if (
					deepgramResponse.status === 401 ||
					deepgramResponse.status === 403
				) {
					console.error('[Deepgram] AUTHENTICATION ERROR', errorDetails)
					throw new Error(
						`Deepgram authentication failed (${deepgramResponse.status}): ` +
							`Check your DEEPGRAM_API_KEY. Resource: ${transcriptOptions.resourceId}`,
					)
				}

				if (deepgramResponse.status >= 500) {
					console.error('[Deepgram] SERVER ERROR', errorDetails)
					throw new Error(
						`Deepgram server error (${deepgramResponse.status}): ` +
							`${deepgramResponse.statusText}. Resource: ${transcriptOptions.resourceId}`,
					)
				}

				console.error('[Deepgram] REQUEST FAILED', errorDetails)
				throw new Error(
					`Deepgram request failed (${deepgramResponse.status}): ` +
						`${deepgramResponse.statusText}. Resource: ${transcriptOptions.resourceId}`,
				)
			}

			console.log('[Deepgram] Transcription request accepted', {
				status: deepgramResponse.status,
				resourceId: transcriptOptions.resourceId,
			})

			return await deepgramResponse.json()
		},
		// Define how to handle the callback with the transcription result
		handleCallback: (
			callbackData: DeepgramResults,
		): DeepgramTranscriptionResult => {
			const srt = srtFromTranscriptResult(callbackData)
			const wordLevelSrt = wordLevelSrtFromTranscriptResult(callbackData)
			const transcript = transcriptAsParagraphsWithTimestamps(callbackData)
			return {
				srt,
				transcript,
				wordLevelSrt,
			}
		},
	}
}

export const ParagraphSchema = z.object({
	text: z.string(),
	sentences: z.array(
		z.object({
			end: z.number(),
			start: z.number(),
			text: z.string(),
		}),
	),
})

export type Paragraph = z.infer<typeof ParagraphSchema>

export const WordSchema = z.object({
	word: z.string(),
	start: z.number(),
	end: z.number(),
	confidence: z.number(),
	punctuated_word: z.string(),
})

export type Word = z.infer<typeof WordSchema>

export const DeepgramResultsSchema = z.object({
	channels: z.array(
		z.object({
			alternatives: z.array(
				z.object({
					transcript: z.string(),
					paragraphs: z
						.object({
							paragraphs: z.array(ParagraphSchema),
						})
						.optional(),
					words: z.array(WordSchema),
				}),
			),
		}),
	),
})

export type DeepgramResults = z.infer<typeof DeepgramResultsSchema>

export function srtFromTranscriptResult(results: DeepgramResults) {
	return srtProcessor(results.channels[0]?.alternatives[0]?.words)
}
export function wordLevelSrtFromTranscriptResult(results: DeepgramResults) {
	return srtProcessor(results.channels[0]?.alternatives[0]?.words, true)
}

function convertTime(inputSeconds?: number) {
	if (!inputSeconds) {
		return '--:--:--'
	}
	const date = new Date(inputSeconds * 1000)
	const hours = String(date.getUTCHours()).padStart(2, '0')
	const minutes = String(date.getUTCMinutes()).padStart(2, '0')
	const seconds = String(date.getUTCSeconds()).padStart(2, '0')

	return `${hours}:${minutes}:${seconds}`
}

function formatTimeString(str: string) {
	const [h, m, s] = str.split(':')
	if (h == '00') {
		return `${m}:${s}`
	}

	return `${h}:${m}:${s}`
}

export function transcriptAsParagraphsWithTimestamps(
	results: DeepgramResults,
): string {
	let paragraphs: Paragraph[] = []
	if (results.channels[0]?.alternatives[0]?.paragraphs) {
		paragraphs = results.channels[0].alternatives[0].paragraphs.paragraphs
	} else if (results.channels[0]?.alternatives[0]?.transcript) {
		const text = results.channels[0].alternatives[0].transcript
		paragraphs = [
			{
				text,
				sentences: [
					{
						text,
						start: 0,
						end:
							results.channels[0].alternatives[0].words[
								results.channels[0].alternatives[0].words?.length - 1 || 0
							]?.end || 0,
					},
				],
			},
		]
	}

	return (
		paragraphs?.reduce(
			(
				acc: string,
				paragraph: {
					sentences: { text: string; start: number; end: number }[]
				},
			): string => {
				const startTime = formatTimeString(
					convertTime(paragraph?.sentences?.[0]?.start),
				)
				const text = paragraph.sentences.map((x) => x.text).join(' ')

				return `${acc}[${startTime}] ${text}

`
			},
			``,
		) || ''
	)
}

function convertTimeSrt(inputSeconds?: number) {
	if (!inputSeconds) {
		return '--:--:--'
	}
	const date = new Date(inputSeconds * 1000)
	const hours = String(date.getUTCHours()).padStart(2, '0')
	const minutes = String(date.getUTCMinutes()).padStart(2, '0')
	const seconds = String(date.getUTCSeconds()).padStart(2, '0')
	const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0')

	return `${hours}:${minutes}:${seconds},${milliseconds}`
}

export function srtProcessor(
	words?: Word[],
	toWordLevelTimestamps: boolean = false,
) {
	if (!words) {
		return ''
	}

	if (toWordLevelTimestamps) {
		const srtEntries = words.map((word, index) => {
			const startTime = convertTimeSrt(word.start)
			const endTime = convertTimeSrt(word.end)
			const text = word.punctuated_word
			return `${index + 1}
${startTime} --> ${endTime}
${text}
`
		})

		return srtEntries.join('\n\n')
	}

	const timeLimitInSeconds = 5.5
	const charLimit = 42
	let currentTimeInSeconds = 0
	let currentCharCount = 0
	const arrayByTimes: Word[][] = []
	let tempArray: Word[] = []

	words.forEach((item, index) => {
		const timeExceeded =
			currentTimeInSeconds + (item.end - item.start) >= timeLimitInSeconds
		const charCountExceeded =
			currentCharCount + item.punctuated_word.length > charLimit

		if (timeExceeded || charCountExceeded || index === words.length - 1) {
			if (tempArray.length) {
				arrayByTimes.push(tempArray)
				tempArray = []
				currentTimeInSeconds = 0
				currentCharCount = 0
			}
		}

		if (!timeExceeded || !charCountExceeded) {
			tempArray.push(item)
			currentTimeInSeconds += item.end - item.start
			currentCharCount += item.punctuated_word.length
		}

		if (index === words.length - 1 && (!timeExceeded || !charCountExceeded)) {
			arrayByTimes.push(tempArray)
		}
	})

	const srtEntries = arrayByTimes.map((timeBlock, index) => {
		const startTime = convertTimeSrt(timeBlock[0]?.start)
		const endTime = convertTimeSrt(timeBlock[timeBlock.length - 1]?.end)
		const text = timeBlock.map((x) => x.punctuated_word).join(' ')
		return `${index + 1}
${startTime} --> ${endTime}
${text}
  `
	})

	return srtEntries.join('\n\n')
}
