'use client'

import { use } from 'react'
import * as React from 'react'
import ReactMarkdown from 'react-markdown'

export function TranscriptContainer({
	transcriptLoader,
}: {
	transcriptLoader: Promise<string | null | undefined>
}) {
	const transcript = use(transcriptLoader)
	return (
		<div className="w-full max-w-2xl pt-5">
			<h3 className="font-bold">Transcript</h3>
			<ReactMarkdown className="prose dark:prose-invert">
				{transcript}
			</ReactMarkdown>
		</div>
	)
}
