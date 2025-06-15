import { notFound } from 'next/navigation'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { DeepgramResponseSchema } from '@/transcript-editor/transcript-deepgram-response'
import TranscriptEditorPage from '@/transcript-editor/transcript-editor-page'
import { transformTranscriptData } from '@/transcript-editor/transform-transcript-data'
import { eq } from 'drizzle-orm/expressions'

/**
 * Video transcript editor route
 * Allows editing transcripts for video resources by videoResourceId
 */
export default async function VideoTranscriptEditor({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { ability } = await getServerAuthSession()
	const { id: videoResourceId } = await params

	// TODO: Add proper ability check for video resource management
	if (!ability) {
		return notFound()
	}

	// Fetch the raw transcript data
	const transcript = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, `raw-transcript-${videoResourceId}`),
	})

	if (!transcript || !transcript.fields) {
		return notFound()
	}

	// Transform the data before validation
	const transformedData = transformTranscriptData(
		DeepgramResponseSchema.parse(transcript.fields),
	)

	// Validate the transformed data
	const transcriptData = DeepgramResponseSchema.parse(transformedData)

	return (
		<TranscriptEditorPage
			transcriptData={transcriptData}
			videoResourceId={videoResourceId}
		/>
	)
}
