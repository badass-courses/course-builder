import { notFound } from 'next/navigation'
import { getServerAuthSession } from '@/server/auth'

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

	// TODO: Fetch transcript data
	// TODO: Transform and validate data
	// TODO: Render client component

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-4xl px-6 py-4">
				<h1 className="text-2xl font-semibold text-gray-800">
					Video Transcript Editor
				</h1>
				<p className="text-gray-600">Video ID: {videoResourceId}</p>
				<p className="mt-2 text-sm text-gray-500">
					TODO: Implement transcript editor functionality
				</p>
			</div>
		</div>
	)
}
