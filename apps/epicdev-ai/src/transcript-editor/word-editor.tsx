import * as React from 'react'
import { Copy, Edit2, Link2, Save, X } from 'lucide-react'

import { Word } from './transcript-deepgram-response'

interface WordEditorProps {
	word: Word
	isEditing: boolean
	editingWord: {
		utteranceId: string
		wordIndex: number
		word: Word
		originalWord: string
	} | null
	occurrences: number
	onEdit: () => void
	onSave: (replaceAll: boolean) => void
	onCancel: () => void
	onChange: (newWord: Word) => void
	onMerge: () => void
	canMerge: boolean
}

/**
 * Individual word editor component with inline editing capabilities
 * Supports single word edits, replace-all functionality, and word merging
 */
export const WordEditor: React.FC<WordEditorProps> = ({
	word,
	isEditing,
	editingWord,
	occurrences,
	onEdit,
	onSave,
	onCancel,
	onChange,
	onMerge,
	canMerge,
}) => {
	const inputRef = React.useRef<HTMLInputElement>(null)

	React.useEffect(() => {
		if (isEditing) {
			inputRef.current?.focus()
			inputRef.current?.select()
		}
	}, [isEditing])

	const getConfidenceColor = (confidence: number) => {
		if (confidence >= 0.9) return 'bg-green-100'
		if (confidence >= 0.7) return 'bg-yellow-100'
		return 'bg-red-100'
	}

	if (isEditing) {
		return (
			<span className="inline-flex items-center space-x-1">
				<input
					ref={inputRef}
					type="text"
					value={editingWord?.word.punctuated_word}
					onChange={(e) =>
						onChange({
							...word,
							word: e.target.value,
							punctuated_word: e.target.value,
						})
					}
					onKeyDown={(e) => {
						if (e.key === 'Escape') {
							onCancel()
						}
						if (e.key === 'Enter') {
							onSave(false)
						}
					}}
					className="focus:outline-hidden rounded border border-blue-300 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400"
				/>
				<button
					onClick={() => onSave(false)}
					className="rounded p-1 hover:bg-green-100"
					title="Save"
				>
					<Save className="h-4 w-4 text-green-600" />
				</button>
				{occurrences > 1 && (
					<button
						onClick={() => onSave(true)}
						className="rounded p-1 hover:bg-blue-100"
						title={`Replace all ${occurrences} occurrences`}
					>
						<Copy className="h-4 w-4 text-blue-600" />
					</button>
				)}
				<button
					onClick={onCancel}
					className="rounded p-1 hover:bg-red-100"
					title="Cancel"
				>
					<X className="h-4 w-4 text-red-600" />
				</button>
			</span>
		)
	}

	return (
		<span className="mx-1 inline-flex items-center">
			<span
				className={`cursor-pointer rounded px-2 py-1 hover:bg-gray-100 ${getConfidenceColor(
					word.confidence,
				)}`}
				onClick={onEdit}
			>
				{word.punctuated_word}
			</span>
			<div className="flex">
				<button
					onClick={onEdit}
					className="p-1 opacity-0 transition-opacity hover:opacity-100"
					title="Edit word"
				>
					<Edit2 className="h-3 w-3 text-gray-400" />
				</button>
				{canMerge && (
					<button
						onClick={onMerge}
						className="p-1 opacity-0 transition-opacity hover:opacity-100"
						title="Merge with next word"
					>
						<Link2 className="h-3 w-3 text-gray-400" />
					</button>
				)}
			</div>
			{occurrences > 1 && (
				<span className="ml-1 text-xs text-gray-500">({occurrences})</span>
			)}
		</span>
	)
}
