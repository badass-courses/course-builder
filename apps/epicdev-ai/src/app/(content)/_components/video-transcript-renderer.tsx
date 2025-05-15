'use client'

import React, { use } from 'react'
import { useMuxPlayer } from '@/hooks/use-mux-player'
import { paragraphWithTimestampButtons } from '@/utils/paragraph-with-timestamp-buttons'
import ReactMarkdown from 'react-markdown'

export function Transcript({
	transcriptLoader,
}: {
	transcriptLoader: Promise<string | null | undefined>
}) {
	let transcript = use(transcriptLoader)

	const { muxPlayerRef } = useMuxPlayer()

	const canShowVideo = true // TODO: Determine if video is available

	return (
		<ReactMarkdown
			components={{
				p: ({ children }) =>
					paragraphWithTimestampButtons({
						children,
						canShowVideo,
						muxPlayerRef,
					}),
			}}
			className="prose dark:prose-invert max-w-none"
		>
			{transcript}
		</ReactMarkdown>
	)
}
