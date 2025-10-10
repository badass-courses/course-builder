'use server'

import { revalidateTag } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import { contentResource } from '@/db/schema'
import { inngest } from '@/inngest/inngest.server'
import { sql } from 'drizzle-orm'

import { VIDEO_SRT_READY_EVENT } from '@coursebuilder/core/inngest/video-processing/events/event-video-srt-ready-to-asset'
import { VIDEO_TRANSCRIPT_READY_EVENT } from '@coursebuilder/core/inngest/video-processing/events/event-video-transcript-ready'
import {
	srtFromTranscriptResult,
	transcriptAsParagraphsWithTimestamps,
	wordLevelSrtFromTranscriptResult,
} from '@coursebuilder/core/providers/deepgram'

import { DeepgramResponse } from './transcript-deepgram-response'

export async function getTranscript(videoResourceId?: string | null) {
	if (!videoResourceId) {
		return null
	}
	const query = sql`
    SELECT
      JSON_EXTRACT (${contentResource.fields}, "$.transcript") AS transcript
    FROM
      ${contentResource}
    WHERE
      type = 'videoResource'
      AND id = ${videoResourceId};
 `
	return db
		.execute(query)
		.then((result) => {
			return (result.rows[0] as { transcript: string | null })?.transcript
		})
		.catch((error) => {
			return error
		})
}

export async function updateTranscript(
	videoResourceId: string,
	deepgramResponse: DeepgramResponse,
) {
	const { deepgramResults } = deepgramResponse
	const srt = srtFromTranscriptResult(deepgramResults)
	const wordLevelSrt = wordLevelSrtFromTranscriptResult(deepgramResults)
	const transcript = transcriptAsParagraphsWithTimestamps(deepgramResults)

	await courseBuilderAdapter.updateContentResourceFields({
		id: `raw-transcript-${videoResourceId}`,
		fields: {
			deepgramResults,
		},
	})

	await courseBuilderAdapter.updateContentResourceFields({
		id: videoResourceId as string,
		fields: {
			transcript,
			srt,
			wordLevelSrt,
		},
	})

	await inngest.send({
		name: VIDEO_TRANSCRIPT_READY_EVENT,
		data: {
			videoResourceId,
		},
	})

	if (srt && wordLevelSrt && videoResourceId) {
		await inngest.send({
			name: VIDEO_SRT_READY_EVENT,
			data: {
				videoResourceId: videoResourceId,
			},
		})
	}

	revalidateTag('posts', 'max')
}
