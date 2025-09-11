import { DeepgramResponse, Word } from './transcript-deepgram-response'

/**
 * Updates a single word in the transcript data and propagates changes
 * to all related structures (utterances, channels, paragraphs)
 */
export function updateTranscriptData(
	prevData: DeepgramResponse,
	utteranceId: string,
	wordIndex: number,
	newWord: Word,
): DeepgramResponse {
	const newData = structuredClone(prevData)

	// Find the utterance and its position in the timeline
	if (!newData.deepgramResults.utterances) return newData

	const utteranceIndex = newData.deepgramResults.utterances.findIndex(
		(u) => u.id === utteranceId,
	)

	if (utteranceIndex === -1) return newData

	const utterance = newData.deepgramResults.utterances[utteranceIndex]
	if (!utterance?.words) return newData

	const word = utterance.words[wordIndex]
	if (!word?.start || !word?.end) return newData

	const wordTimeRange = {
		start: word.start,
		end: word.end,
	}

	// Update the word in the utterance
	utterance.words[wordIndex] = {
		...newWord,
		start: wordTimeRange.start,
		end: wordTimeRange.end,
	}

	// Update utterance transcript
	utterance.transcript = utterance.words
		.map((w) => w.punctuated_word)
		.join(' ')
		.replace(/\s([,.!?])/g, '$1')

	// Recalculate utterance confidence
	utterance.confidence =
		utterance.words.reduce((sum, word) => sum + word.confidence, 0) /
		utterance.words.length

	// Update all channel alternatives that overlap with this time range
	newData.deepgramResults.channels.forEach((channel) => {
		channel.alternatives.forEach((alt) => {
			// Find words in this alternative that overlap with our target word's time range
			alt.words.forEach((word, idx) => {
				if (
					word.start >= wordTimeRange.start &&
					word.end <= wordTimeRange.end
				) {
					alt.words[idx] = {
						...newWord,
						start: word.start,
						end: word.end,
					}
				}
			})

			// Update alternative transcript
			alt.transcript = alt.words
				.map((w) => w.punctuated_word)
				.join(' ')
				.replace(/\s([,.!?])/g, '$1')

			// Recalculate alternative confidence
			if (alt.confidence !== undefined) {
				alt.confidence =
					alt.words.reduce((sum, word) => sum + word.confidence, 0) /
					alt.words.length
			}

			// Update paragraphs that contain this word
			if (alt.paragraphs) {
				alt.paragraphs.paragraphs.forEach((paragraph) => {
					// Find sentences that overlap with our word's time range
					paragraph.sentences.forEach((sentence) => {
						if (
							sentence.start <= wordTimeRange.end &&
							sentence.end >= wordTimeRange.start
						) {
							// Rebuild sentence text from words
							const sentenceWords = alt.words.filter(
								(w) => w.start >= sentence.start && w.end <= sentence.end,
							)
							sentence.text = sentenceWords
								.map((w) => w.punctuated_word)
								.join(' ')
								.replace(/\s([,.!?])/g, '$1')
						}
					})

					// Update paragraph text from sentences
					paragraph.text = paragraph.sentences.map((s) => s.text).join(' ')
				})
			}
		})
	})

	return newData
}

/**
 * Replaces all occurrences of a word throughout the transcript
 */
export function replaceAllWords(
	prevData: DeepgramResponse,
	originalWord: string,
	newWord: Word,
): DeepgramResponse {
	const newData = structuredClone(prevData)

	// Update all utterances
	if (newData.deepgramResults.utterances) {
		newData.deepgramResults.utterances.forEach((utterance) => {
			let updated = false
			utterance.words.forEach((word, index) => {
				if (word.word.toLowerCase() === originalWord.toLowerCase()) {
					utterance.words[index] = {
						...newWord,
						start: word.start,
						end: word.end,
					}
					updated = true
				}
			})

			if (updated) {
				// Update utterance transcript
				utterance.transcript = utterance.words
					.map((w) => w.punctuated_word)
					.join(' ')
					.replace(/\s([,.!?])/g, '$1')

				// Recalculate confidence
				utterance.confidence =
					utterance.words.reduce((sum, word) => sum + word.confidence, 0) /
					utterance.words.length
			}
		})
	}

	// Update all channels
	newData.deepgramResults.channels.forEach((channel) => {
		channel.alternatives.forEach((alt) => {
			let updated = false
			alt.words.forEach((word, index) => {
				if (word.word.toLowerCase() === originalWord.toLowerCase()) {
					alt.words[index] = {
						...newWord,
						start: word.start,
						end: word.end,
					}
					updated = true
				}
			})

			if (updated) {
				// Update alternative transcript
				alt.transcript = alt.words
					.map((w) => w.punctuated_word)
					.join(' ')
					.replace(/\s([,.!?])/g, '$1')

				// Recalculate confidence if it exists
				if (alt.confidence !== undefined) {
					alt.confidence =
						alt.words.reduce((sum, word) => sum + word.confidence, 0) /
						alt.words.length
				}

				// Update paragraphs
				if (alt.paragraphs) {
					alt.paragraphs.paragraphs.forEach((paragraph) => {
						paragraph.sentences.forEach((sentence) => {
							const sentenceWords = alt.words.filter(
								(w) => w.start >= sentence.start && w.end <= sentence.end,
							)
							sentence.text = sentenceWords
								.map((w) => w.punctuated_word)
								.join(' ')
								.replace(/\s([,.!?])/g, '$1')
						})

						// Update paragraph text from sentences
						paragraph.text = paragraph.sentences.map((s) => s.text).join(' ')
					})
				}
			}
		})
	})

	return newData
}

/**
 * Helper function to properly merge punctuated words while preserving
 * capitalization, contractions, and punctuation from both words
 */
function mergePunctuatedWords(word1: string, word2: string): string {
	// Remove trailing punctuation from first word
	const word1Base = word1.replace(/[,.!?;:]*$/, '')

	// Remove leading punctuation from second word but preserve trailing
	const word2Match = word2.match(/^[^a-zA-Z0-9]*(.+?)([,.!?;:]*)$/)
	const word2Base = word2Match?.[1] || word2
	const word2TrailingPunct = word2Match?.[2] || ''

	// Combine the words and add back trailing punctuation
	return `${word1Base}${word2Base}${word2TrailingPunct}`
}

/**
 * Merges two adjacent words into a single word
 */
export function mergeWords(
	prevData: DeepgramResponse,
	utteranceId: string,
	wordIndex: number,
): DeepgramResponse {
	const newData = structuredClone(prevData)

	if (!newData.deepgramResults.utterances) return newData

	const utteranceIndex = newData.deepgramResults.utterances.findIndex(
		(u) => u.id === utteranceId,
	)

	if (utteranceIndex === -1) return newData

	const utterance = newData.deepgramResults.utterances[utteranceIndex]
	if (!utterance?.words || wordIndex >= utterance.words.length - 1)
		return newData

	const word1 = utterance.words[wordIndex]
	const word2 = utterance.words[wordIndex + 1]
	if (!word1 || !word2) return newData

	// Create merged word
	const mergedWord: Word = {
		word: `${word1.word}${word2.word}`,
		punctuated_word: mergePunctuatedWords(
			word1.punctuated_word,
			word2.punctuated_word,
		),
		start: word1.start,
		end: word2.end,
		confidence: (word1.confidence + word2.confidence) / 2,
	}

	// Replace the two words with the merged word
	utterance.words.splice(wordIndex, 2, mergedWord)

	// Update utterance transcript
	utterance.transcript = utterance.words
		.map((w) => w.punctuated_word)
		.join(' ')
		.replace(/\s([,.!?])/g, '$1')

	// Update channel alternatives
	newData.deepgramResults.channels.forEach((channel) => {
		channel.alternatives.forEach((alt) => {
			// Find and merge corresponding words in the alternative
			const altWordIndex = alt.words.findIndex(
				(w) => w.start === word1.start && w.end === word1.end,
			)
			if (altWordIndex !== -1 && altWordIndex < alt.words.length - 1) {
				alt.words.splice(altWordIndex, 2, mergedWord)

				// Update alternative transcript
				alt.transcript = alt.words
					.map((w) => w.punctuated_word)
					.join(' ')
					.replace(/\s([,.!?])/g, '$1')

				// Update paragraphs if they exist
				if (alt.paragraphs) {
					alt.paragraphs.paragraphs.forEach((paragraph) => {
						paragraph.sentences.forEach((sentence) => {
							if (
								sentence.start <= mergedWord.end &&
								sentence.end >= mergedWord.start
							) {
								const sentenceWords = alt.words.filter(
									(w) => w.start >= sentence.start && w.end <= sentence.end,
								)
								sentence.text = sentenceWords
									.map((w) => w.punctuated_word)
									.join(' ')
									.replace(/\s([,.!?])/g, '$1')
							}
						})

						// Update paragraph text
						paragraph.text = paragraph.sentences.map((s) => s.text).join(' ')
					})
				}
			}
		})
	})

	return newData
}
