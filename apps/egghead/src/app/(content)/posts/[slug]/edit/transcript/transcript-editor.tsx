'use client'

import * as React from 'react'
import Link from 'next/link'
import { TranscriptEditor } from '@/components/transcript-editor/transcript-editor'
import { DeepgramResponse, Word } from '@/lib/transcript-deepgram-response'
import { updateTranscript } from '@/lib/transcript-query'
import { mergeWords } from '@/utils/transcript-deepgram-utils'

export default function TranscriptEditorPage({
	transcriptData: initialTranscriptData,
	videoResourceId,
	slug,
}: {
	transcriptData: DeepgramResponse
	videoResourceId: string
	slug: string
}) {
	const [transcriptData, setTranscriptData] = React.useState<DeepgramResponse>(
		initialTranscriptData,
	)
	const [isDirty, setIsDirty] = React.useState(false)

	const handleUpdateWord = (
		utteranceId: string,
		wordIndex: number,
		newWord: Word,
	) => {
		setIsDirty(true)
		setTranscriptData((prevData) => {
			const newData = structuredClone(prevData)

			// Update in utterances
			const utteranceIndex = newData.deepgramResults.utterances.findIndex(
				(u) => u.id === utteranceId,
			)

			if (utteranceIndex === -1) return newData

			const utterance = newData.deepgramResults.utterances[utteranceIndex]
			if (!utterance?.words) return newData

			utterance.words[wordIndex] = newWord

			// Update transcript
			utterance.transcript = utterance.words
				.map((w) => w.punctuated_word)
				.join(' ')
				.replace(/\s([,.!?])/g, '$1')

			// Update in channels
			newData.deepgramResults.channels.forEach((channel) => {
				channel.alternatives.forEach((alt) => {
					if (wordIndex < alt.words.length) {
						alt.words[wordIndex] = newWord
						alt.transcript = alt.words
							.map((w) => w.punctuated_word)
							.join(' ')
							.replace(/\s([,.!?])/g, '$1')

						// Update paragraphs if they exist
						if (alt.paragraphs) {
							alt.paragraphs.paragraphs.forEach((paragraph) => {
								paragraph.sentences.forEach((sentence) => {
									if (
										sentence.start <= newWord.end &&
										sentence.end >= newWord.start
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
								paragraph.text = paragraph.sentences
									.map((s) => s.text)
									.join(' ')
							})
						}
					}
				})
			})

			return newData
		})
	}

	const handleReplaceAll = (originalWord: string, newWord: Word) => {
		setIsDirty(true)
		setTranscriptData((prevData) => {
			const newData = structuredClone(prevData)

			// Update in utterances
			newData.deepgramResults.utterances.forEach((utterance) => {
				if (!utterance?.words) return

				let updated = false
				utterance.words.forEach((word, wordIndex) => {
					if (word.word.toLowerCase() === originalWord.toLowerCase()) {
						utterance.words[wordIndex] = {
							...newWord,
							start: word.start,
							end: word.end,
						}
						updated = true
					}
				})

				if (updated) {
					// Update transcript
					utterance.transcript = utterance.words
						.map((w) => w.punctuated_word)
						.join(' ')
						.replace(/\s([,.!?])/g, '$1')
				}
			})

			// Update in channels
			newData.deepgramResults.channels.forEach((channel) => {
				channel.alternatives.forEach((alt) => {
					let updated = false
					alt.words.forEach((word, wordIndex) => {
						if (word.word.toLowerCase() === originalWord.toLowerCase()) {
							alt.words[wordIndex] = {
								...newWord,
								start: word.start,
								end: word.end,
							}
							updated = true
						}
					})

					if (updated) {
						alt.transcript = alt.words
							.map((w) => w.punctuated_word)
							.join(' ')
							.replace(/\s([,.!?])/g, '$1')

						// Update paragraphs if they exist
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

								// Update paragraph text
								paragraph.text = paragraph.sentences
									.map((s) => s.text)
									.join(' ')
							})
						}
					}
				})
			})

			return newData
		})
	}

	const handleMergeWords = (utteranceId: string, wordIndex: number) => {
		setIsDirty(true)
		setTranscriptData((prevData) =>
			mergeWords(prevData, utteranceId, wordIndex),
		)
	}

	const handleSave = async () => {
		const result = await updateTranscript(videoResourceId, transcriptData)
		setIsDirty(false)
	}

	const handleDiscard = () => {
		setTranscriptData(initialTranscriptData)
		setIsDirty(false)
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="bg-white shadow-sm">
				<div className="mx-auto max-w-4xl px-6 py-4">
					<div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
						<Link href={`/${slug}`}>View</Link>
						<span>/</span>
						<Link href={`/posts/${slug}/edit`}>Edit</Link>
						<span>/</span>
						<span className="text-gray-900">Transcript</span>
					</div>
					<div className="flex items-center justify-between">
						<h1 className="text-2xl font-semibold text-gray-800">
							Transcript Editor
						</h1>
						{isDirty && (
							<div className="flex gap-2">
								<button
									onClick={handleDiscard}
									className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-600 hover:bg-gray-50"
								>
									Discard Changes
								</button>
								<button
									onClick={handleSave}
									className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
								>
									Save Changes
								</button>
							</div>
						)}
					</div>
				</div>
			</header>
			<main className="py-8">
				<TranscriptEditor
					utterances={transcriptData.deepgramResults.utterances}
					onUpdateWord={handleUpdateWord}
					onReplaceAll={handleReplaceAll}
					onMergeWords={handleMergeWords}
				/>
			</main>
		</div>
	)
}
