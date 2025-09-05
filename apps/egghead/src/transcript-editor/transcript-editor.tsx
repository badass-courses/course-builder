'use client'

import * as React from 'react'

import { Utterance, Word } from './transcript-deepgram-response'
import { WordEditor } from './word-editor'

interface TranscriptEditorProps {
	utterances: Utterance[]
	onUpdateWord: (utteranceId: string, wordIndex: number, newWord: Word) => void
	onReplaceAll: (originalWord: string, newWord: Word) => void
	onMergeWords: (utteranceId: string, wordIndex: number) => void
}

/**
 * Main transcript editor component that displays utterances and manages word editing
 * Handles word-level editing, replace-all functionality, and word merging
 */
export const TranscriptEditor: React.FC<TranscriptEditorProps> = ({
	utterances,
	onUpdateWord,
	onReplaceAll,
	onMergeWords,
}) => {
	const [editingWord, setEditingWord] = React.useState<{
		utteranceId: string
		wordIndex: number
		word: Word
		originalWord: string
	} | null>(null)

	const handleEditWord = (
		utteranceId: string,
		wordIndex: number,
		word: Word,
	) => {
		setEditingWord({
			utteranceId,
			wordIndex,
			word: { ...word },
			originalWord: word.word,
		})
	}

	const handleSaveWord = (replaceAll: boolean = false) => {
		if (editingWord) {
			if (replaceAll) {
				onReplaceAll(editingWord.originalWord, editingWord.word)
			} else {
				onUpdateWord(
					editingWord.utteranceId,
					editingWord.wordIndex,
					editingWord.word,
				)
			}
			setEditingWord(null)
		}
	}

	const handleCancelEdit = () => {
		setEditingWord(null)
	}

	// Replace the old reducer-based implementation with a memoized map
	const wordCounts = React.useMemo(() => {
		const map = new Map<string, number>()
		utterances.forEach((u) =>
			u.words.forEach((w) =>
				map.set(w.word.toLowerCase(), (map.get(w.word.toLowerCase()) ?? 0) + 1),
			),
		)
		return map
	}, [utterances])

	const countWordOccurrences = (word: string) =>
		wordCounts.get(word.toLowerCase()) ?? 0

	const handleMergeWords = (utteranceId: string, wordIndex: number) => {
		onMergeWords(utteranceId, wordIndex)
	}

	return (
		<div className="mx-auto max-w-4xl space-y-8 p-6">
			{utterances.map((utterance) => (
				<div
					key={utterance.id}
					className="space-y-4 rounded-lg bg-white p-6 shadow-md"
				>
					<div className="mb-4 flex items-center justify-between">
						<div className="text-sm text-gray-500">
							ID: {utterance.id} | Channel: {utterance.channel}
						</div>
						<div className="text-sm text-gray-500">
							{(utterance.end - utterance.start).toFixed(2)}s
						</div>
					</div>
					<div className="space-y-2">
						{utterance.words.map((word, index) => (
							<WordEditor
								key={`${utterance.id}-${index}`}
								word={word}
								isEditing={
									editingWord?.utteranceId === utterance.id &&
									editingWord?.wordIndex === index
								}
								editingWord={editingWord}
								occurrences={countWordOccurrences(word.word)}
								onEdit={() => handleEditWord(utterance.id, index, word)}
								onSave={handleSaveWord}
								onCancel={handleCancelEdit}
								onChange={(newWord) =>
									setEditingWord((prev) =>
										prev ? { ...prev, word: newWord } : null,
									)
								}
								onMerge={() => handleMergeWords(utterance.id, index)}
								canMerge={index < utterance.words.length - 1}
							/>
						))}
					</div>
				</div>
			))}
		</div>
	)
}
