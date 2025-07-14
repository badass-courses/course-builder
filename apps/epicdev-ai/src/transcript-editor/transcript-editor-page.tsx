'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'

import { updateTranscript } from './actions'
import { DeepgramResponse, Word } from './transcript-deepgram-response'
import {
	mergeWords,
	replaceAllWords,
	updateTranscriptData,
} from './transcript-deepgram-utils'
import { TranscriptEditor } from './transcript-editor'

interface TranscriptEditorPageProps {
	transcriptData: DeepgramResponse
	videoResourceId: string
}

/**
 * Client-side transcript editor page component
 * Manages transcript state, handles word editing operations, and saves changes
 */
export default function TranscriptEditorPage({
	transcriptData: initialTranscriptData,
	videoResourceId,
}: TranscriptEditorPageProps) {
	const [transcriptData, setTranscriptData] = React.useState<DeepgramResponse>(
		initialTranscriptData,
	)
	const [isDirty, setIsDirty] = React.useState(false)
	const [isSaving, setIsSaving] = React.useState(false)

	const handleUpdateWord = (
		utteranceId: string,
		wordIndex: number,
		newWord: Word,
	) => {
		setIsDirty(true)
		setTranscriptData((prevData) =>
			updateTranscriptData(prevData, utteranceId, wordIndex, newWord),
		)
	}

	const handleReplaceAll = (originalWord: string, newWord: Word) => {
		setIsDirty(true)
		setTranscriptData((prevData) =>
			replaceAllWords(prevData, originalWord, newWord),
		)
	}

	const handleMergeWords = (utteranceId: string, wordIndex: number) => {
		setIsDirty(true)
		setTranscriptData((prevData) =>
			mergeWords(prevData, utteranceId, wordIndex),
		)
	}

	const handleSave = async () => {
		try {
			setIsSaving(true)
			await updateTranscript(videoResourceId, transcriptData)
			setIsDirty(false)
		} catch (error) {
			console.error('Failed to save transcript:', error)
			// TODO: Add proper error handling/toast notification
		} finally {
			setIsSaving(false)
		}
	}

	const handleDiscard = () => {
		setTranscriptData(initialTranscriptData)
		setIsDirty(false)
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="shadow-xs bg-white">
				<div className="mx-auto max-w-4xl px-6 py-4">
					<div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
						<span className="text-gray-900">Video Transcript Editor</span>
					</div>
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-semibold text-gray-800">
								Transcript Editor
							</h1>
							<p className="mt-1 text-sm text-gray-600">
								Video ID: {videoResourceId}
							</p>
						</div>
						{isDirty && (
							<div className="flex gap-2">
								<button
									onClick={handleDiscard}
									disabled={isSaving}
									className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
								>
									Discard Changes
								</button>
								<button
									onClick={handleSave}
									disabled={isSaving}
									className="flex items-center gap-2 rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
								>
									{isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
									{isSaving ? 'Saving...' : 'Save Changes'}
								</button>
							</div>
						)}
					</div>
				</div>
			</header>
			<main className="py-8">
				{transcriptData.deepgramResults.utterances ? (
					<TranscriptEditor
						utterances={transcriptData.deepgramResults.utterances}
						onUpdateWord={handleUpdateWord}
						onReplaceAll={handleReplaceAll}
						onMergeWords={handleMergeWords}
					/>
				) : (
					<div className="mx-auto max-w-4xl p-6">
						<div className="rounded-lg bg-white p-8 text-center shadow-md">
							<h2 className="mb-2 text-xl font-semibold text-gray-800">
								No Utterances Available
							</h2>
							<p className="text-gray-600">
								This transcript doesn't contain utterance data. Utterances may
								not have been enabled during transcription.
							</p>
						</div>
					</div>
				)}
			</main>
		</div>
	)
}
