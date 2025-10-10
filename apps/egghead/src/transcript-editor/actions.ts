'use server'

import { revalidateTag } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import { inngest } from '@/inngest/inngest.server'

import { VIDEO_SRT_READY_EVENT } from '@coursebuilder/core/inngest/video-processing/events/event-video-srt-ready-to-asset'
import { VIDEO_TRANSCRIPT_READY_EVENT } from '@coursebuilder/core/inngest/video-processing/events/event-video-transcript-ready'
import {
	srtFromTranscriptResult,
	transcriptAsParagraphsWithTimestamps,
	wordLevelSrtFromTranscriptResult,
} from '@coursebuilder/core/providers/deepgram'

import { DeepgramResponse } from './transcript-deepgram-response'

/**
 * Updates a video transcript with new Deepgram response data
 * Generates SRT files and triggers downstream processing events
 */
export async function updateTranscript(
	videoResourceId: string,
	deepgramResponse: DeepgramResponse,
) {
	const { deepgramResults } = deepgramResponse
	const srt = srtFromTranscriptResult(deepgramResults)
	const wordLevelSrt = wordLevelSrtFromTranscriptResult(deepgramResults)
	const transcript = transcriptAsParagraphsWithTimestamps(deepgramResults)

	// Update the raw transcript data
	await courseBuilderAdapter.updateContentResourceFields({
		id: `raw-transcript-${videoResourceId}`,
		fields: {
			deepgramResults,
		},
	})

	// Update the video resource with processed transcript formats
	await courseBuilderAdapter.updateContentResourceFields({
		id: videoResourceId as string,
		fields: {
			transcript,
			srt,
			wordLevelSrt,
		},
	})

	// Trigger transcript ready event
	await inngest.send({
		name: VIDEO_TRANSCRIPT_READY_EVENT,
		data: {
			videoResourceId,
		},
	})

	// Trigger SRT ready event if we have both SRT formats
	if (srt && wordLevelSrt && videoResourceId) {
		await inngest.send({
			name: VIDEO_SRT_READY_EVENT,
			data: {
				videoResourceId: videoResourceId,
			},
		})
	}

	// Revalidate relevant caches
	revalidateTag('posts', 'max')
	revalidateTag('videos', 'max')
}
