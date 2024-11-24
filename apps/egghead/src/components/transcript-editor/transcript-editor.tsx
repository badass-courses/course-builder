'use client'

import * as React from 'react'
import { Utterance, Word } from '@/lib/transcript-deepgram-response'
import { Copy, Edit2, Link2, Save, X } from 'lucide-react'

import { WordEditor } from './word-editor'

interface TranscriptEditorProps {
	utterances: Utterance[]
	onUpdateWord: (utteranceId: string, wordIndex: number, newWord: Word) => void
	onReplaceAll: (originalWord: string, newWord: Word) => void
	onMergeWords: (utteranceId: string, wordIndex: number) => void
}

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

	const countWordOccurrences = (word: string) => {
		return utterances.reduce((count, utterance) => {
			return (
				count +
				utterance.words.filter(
					(w) => w.word.toLowerCase() === word.toLowerCase(),
				).length
			)
		}, 0)
	}

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
