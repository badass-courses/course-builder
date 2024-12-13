import {
	DeepgramResponse,
	DeepgramResponseSchema,
	Word,
} from '@/lib/transcript-deepgram-response'
import { beforeEach, describe, expect, it } from 'vitest'

import { sampleData } from '../data/sampleTranscript'
import {
	mergeWords,
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

	describe('mergeWords', () => {
		let utterance: (typeof validatedData.deepgramResults.utterances)[0]
		let word1: Word
		let word2: Word

		beforeEach(() => {
			const firstUtterance = validatedData.deepgramResults.utterances[0]
			if (!firstUtterance || !firstUtterance.words) {
				throw new Error('Invalid test data: missing utterance or word data')
			}
			utterance = firstUtterance

			const firstWord = utterance.words[0]
			const secondWord = utterance.words[1]
			if (!firstWord || !secondWord) {
				throw new Error('Invalid test data: need at least two words')
			}
			word1 = firstWord
			word2 = secondWord
		})

		it('should merge two adjacent words in utterance', () => {
			const result = mergeWords(validatedData, utterance.id, 0)
			const mergedWord = result.deepgramResults.utterances[0]?.words[0]

			expect(mergedWord?.word).toBe(`${word1.word}${word2.word}`)
		})

		it('should preserve start time of first word and end time of second word', () => {
			const result = mergeWords(validatedData, utterance.id, 0)
			const mergedWord = result.deepgramResults.utterances[0]?.words[0]

			expect(mergedWord?.start).toBe(word1.start)
			expect(mergedWord?.end).toBe(word2.end)
		})

		it('should average the confidence of merged words', () => {
			const result = mergeWords(validatedData, utterance.id, 0)
			const mergedWord = result.deepgramResults.utterances[0]?.words[0]

			const expectedConfidence = (word1.confidence + word2.confidence) / 2
			expect(mergedWord?.confidence).toBe(expectedConfidence)
		})

		it('should update the utterance transcript after merging', () => {
			const result = mergeWords(validatedData, utterance.id, 0)
			const updatedUtterance = result.deepgramResults.utterances[0]

			expect(updatedUtterance?.transcript).toBe(
				updatedUtterance?.words
					.map((w) => w.punctuated_word)
					.join(' ')
					.replace(/\s([,.!?])/g, '$1'),
			)
		})

		it('should merge corresponding words in channels', () => {
			const result = mergeWords(validatedData, utterance.id, 0)
			const channelWord =
				result.deepgramResults.channels[0]?.alternatives[0]?.words[0]

			expect(channelWord?.word).toBe(`${word1.word}${word2.word}`)
		})

		it('should preserve punctuation from second word', () => {
			// Create test data with punctuation
			const testData = structuredClone(validatedData)
			const firstUtterance = testData.deepgramResults.utterances[0]
			if (!firstUtterance?.words?.[1]) {
				throw new Error('Invalid test data structure')
			}

			firstUtterance.words[1].punctuated_word = 'word.'

			const result = mergeWords(testData, utterance.id, 0)
			const mergedWord = result.deepgramResults.utterances[0]?.words[0]

			expect(mergedWord?.punctuated_word.endsWith('.')).toBe(true)
		})

		it('should return unmodified data for non-existent utterance', () => {
			const result = mergeWords(validatedData, 'non-existent-id', 0)
			expect(result).toEqual(validatedData)
		})

		it('should return unmodified data for invalid word index', () => {
			const result = mergeWords(
				validatedData,
				utterance.id,
				utterance.words.length - 1,
			)
			expect(result).toEqual(validatedData)
		})

		it('should reduce total word count by one', () => {
			const originalWordCount =
				validatedData.deepgramResults.utterances[0]?.words.length || 0
			const result = mergeWords(validatedData, utterance.id, 0)
			const newWordCount =
				result.deepgramResults.utterances[0]?.words.length || 0

			expect(newWordCount).toBe(originalWordCount - 1)
		})

		it('should not mutate original data', () => {
			const originalWordCount =
				validatedData.deepgramResults.utterances[0]?.words.length || 0
			mergeWords(validatedData, utterance.id, 0)

			expect(validatedData.deepgramResults.utterances[0]?.words.length).toBe(
				originalWordCount,
			)
		})
	})
})
