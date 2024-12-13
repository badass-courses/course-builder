import { notFound, redirect } from 'next/navigation'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { getPost } from '@/lib/posts-query'
import {
	Alternative,
	Channel,
	DeepgramResponse,
	DeepgramResponseSchema,
	Paragraph,
	Sentence,
} from '@/lib/transcript-deepgram-response'
import { getServerAuthSession } from '@/server/auth'
import { subject } from '@casl/ability'
import { eq } from 'drizzle-orm/expressions'

import TranscriptEditorPage from './transcript-editor'

function transformTranscriptData(data: DeepgramResponse): DeepgramResponse {
	const transformed = structuredClone(data)

	transformed.deepgramResults.channels.forEach((channel: Channel) => {
		channel.alternatives.forEach((alt: Alternative) => {
			if (alt.paragraphs) {
				// Transform paragraphs to match new schema
				alt.paragraphs.paragraphs = alt.paragraphs.paragraphs.map(
					(paragraph: Paragraph) => {
						// Combine sentences text to create paragraph text
						const text = paragraph.sentences
							.map((s: Sentence) => s.text)
							.join(' ')

						return {
							text,
							sentences: paragraph.sentences,
						}
					},
				)
			}
		})
	})

	return transformed
}

export default async function TranscriptEditor({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { ability } = await getServerAuthSession()
	const { slug } = await params
	const post = await getPost(slug)

	if (!post) {
		return notFound()
	}

	if (ability.cannot('manage', subject('Content', post))) {
		redirect(`/${post?.fields?.slug}`)
	}

	const videoResourceId = post.resources?.find(
		(resource) => resource.resource.type === 'videoResource',
	)?.resourceId

	if (!videoResourceId) {
		return notFound()
	}

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
			slug={slug}
		/>
	)
}
