import {
	DeepgramResponse,
	DeepgramResponseSchema,
	Word,
} from '@/lib/transcript-deepgram-response'
import { beforeEach, describe, expect, it } from 'vitest'

import { sampleData } from '../data/sampleTranscript'
import {
	replaceAllWords,
	updateTranscriptData,
} from './transcript-deepgram-utils'

describe('transcript-deepgram-utils', () => {
	const validatedData = DeepgramResponseSchema.parse(
		sampleData,
	) as DeepgramResponse

	describe('updateTranscriptData', () => {
		let newWord: Word
		let utterance: (typeof validatedData.deepgramResults.utterances)[0]
		let originalWord: (typeof validatedData.deepgramResults.utterances)[0]['words'][0]

		beforeEach(() => {
			const firstUtterance = validatedData.deepgramResults.utterances[0]
			if (
				!firstUtterance ||
				!firstUtterance.words ||
				!firstUtterance.words[0]
			) {
				throw new Error('Invalid test data: missing utterance or word data')
			}

			utterance = firstUtterance
			originalWord = firstUtterance.words[0]

			newWord = {
				word: 'updated',
				confidence: 1.0,
				punctuated_word: 'Updated',
				start: 0,
				end: 0,
			}
		})

		it('should preserve original timing when updating a word', () => {
			const result = updateTranscriptData(
				validatedData,
				utterance.id,
				0,
				newWord,
			)
			const updatedWord = result.deepgramResults.utterances[0]?.words[0]

			expect(updatedWord?.start).toBe(originalWord.start)
		})

		it('should update word text in utterance', () => {
			const result = updateTranscriptData(
				validatedData,
				utterance.id,
				0,
				newWord,
			)
			const updatedWord = result.deepgramResults.utterances[0]?.words[0]

			expect(updatedWord?.word).toBe('updated')
		})

		it('should update punctuated word in utterance', () => {
			const result = updateTranscriptData(
				validatedData,
				utterance.id,
				0,
				newWord,
			)
			const updatedWord = result.deepgramResults.utterances[0]?.words[0]

			expect(updatedWord?.punctuated_word).toBe('Updated')
		})

		it('should update the utterance transcript', () => {
			const result = updateTranscriptData(
				validatedData,
				utterance.id,
				0,
				newWord,
			)

			expect(result.deepgramResults.utterances[0]?.transcript).toContain(
				'Updated',
			)
		})

		it('should not mutate the original data', () => {
			updateTranscriptData(validatedData, utterance.id, 0, newWord)

			expect(validatedData.deepgramResults.utterances[0]?.words[0]?.word).toBe(
				'install',
			)
		})

		it('should update corresponding word in channels', () => {
			const result = updateTranscriptData(
				validatedData,
				utterance.id,
				0,
				newWord,
			)
			const channelWord =
				result.deepgramResults.channels[0]?.alternatives[0]?.words[0]

			expect(channelWord?.word).toBe('updated')
		})

		it('should preserve timing in channel words', () => {
			const result = updateTranscriptData(
				validatedData,
				utterance.id,
				0,
				newWord,
			)
			const channelWord =
				result.deepgramResults.channels[0]?.alternatives[0]?.words[0]

			expect(channelWord?.start).toBe(originalWord.start)
		})

		it('should return unmodified data for non-existent utterance', () => {
			const result = updateTranscriptData(
				validatedData,
				'non-existent-id',
				0,
				newWord,
			)

			expect(result).toEqual(validatedData)
		})
	})

	describe('replaceAllWords', () => {
		let newWord: Word

		beforeEach(() => {
			newWord = {
				word: 'updated',
				confidence: 1.0,
				punctuated_word: 'Updated',
				start: 0,
				end: 0,
			}
		})

		it('should update all matching words in utterances', () => {
			const result = replaceAllWords(validatedData, 'the', newWord)
			const matchingWords = result.deepgramResults.utterances[0]?.words.filter(
				(w) => w.word.toLowerCase() === 'updated',
			)

			expect(matchingWords?.length).toBeGreaterThan(0)
		})

		it('should update all matching words in channels', () => {
			const result = replaceAllWords(validatedData, 'the', newWord)
			const matchingWords =
				result.deepgramResults.channels[0]?.alternatives[0]?.words.filter(
					(w) => w.word.toLowerCase() === 'updated',
				)

			expect(matchingWords?.length).toBeGreaterThan(0)
		})

		it('should preserve timing information of replaced words', () => {
			const firstUtterance = validatedData.deepgramResults.utterances[0]
			if (!firstUtterance) throw new Error('No utterance found in test data')

			const originalWord = firstUtterance.words[1] // 'the'
			if (!originalWord) throw new Error('Original word not found')

			const result = replaceAllWords(validatedData, 'the', newWord)
			const updatedWord = result.deepgramResults.utterances[0]?.words[1]

			expect(updatedWord?.start).toBe(originalWord.start)
		})

		it('should not mutate original data', () => {
			replaceAllWords(validatedData, 'the', newWord)
			const originalWord = validatedData.deepgramResults.utterances[0]?.words[1]

			expect(originalWord?.word).toBe('the')
		})
	})
})
