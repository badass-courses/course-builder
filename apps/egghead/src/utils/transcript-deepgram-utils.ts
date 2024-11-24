import { DeepgramResponse, Word } from '@/lib/transcript-deepgram-response'

export function updateTranscriptData(
	prevData: DeepgramResponse,
	utteranceId: string,
	wordIndex: number,
	newWord: Word,
): DeepgramResponse {
	const newData = structuredClone(prevData)

	// Find the utterance and its position in the timeline
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

export function replaceAllWords(
	prevData: DeepgramResponse,
	originalWord: string,
	newWord: Word,
): DeepgramResponse {
	const newData = structuredClone(prevData)

	// Update all utterances
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
