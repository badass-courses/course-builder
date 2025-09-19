'use client'

import { useMuxPlayer } from '@/hooks/use-mux-player'
import { paragraphWithTimestampButtons } from '@/utils/paragraph-with-timestamp-buttons'
import type { MuxPlayerRefAttributes } from '@mux/mux-player-react'
import { AlignLeft, FileText, FileVideo, Video } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@coursebuilder/ui'

export default function PostTranscript({
	transcript,
}: {
	transcript?: string | null
}) {
	const { muxPlayerRef } = useMuxPlayer()

	if (!transcript) return null
	return (
		<Accordion type="single" defaultValue="open" collapsible>
			<AccordionItem value="open" className="rounded-md border">
				<AccordionTrigger className="hover:bg-muted/50 dark:hover:bg-muted/30 w-full justify-between p-5">
					<span className="flex items-center gap-2 font-medium sm:text-lg">
						<FileVideo className="text-primary size-4" /> Video Transcript
					</span>
				</AccordionTrigger>
				<AccordionContent className="px-5 pb-5">
					<ReactMarkdown
						components={{
							p: ({ children }) =>
								paragraphWithTimestampButtons({
									children,
									canShowVideo: true,
									muxPlayerRef,
								}),
						}}
						className="prose dark:prose-invert [&_button]:text-primary max-w-none"
					>
						{transcript}
					</ReactMarkdown>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	)
}
