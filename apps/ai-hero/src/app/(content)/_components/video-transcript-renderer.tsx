'use client'

import React, { use } from 'react'
import { useMuxPlayer } from '@/hooks/use-mux-player'
import type { MuxPlayerRefAttributes } from '@mux/mux-player-react'
import { FileText, TextIcon, VideoIcon } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

import type { ContentResource } from '@coursebuilder/core/schemas'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@coursebuilder/ui'
import type { AbilityForResource } from '@coursebuilder/utils-auth/current-ability-rules'

export function Transcript({
	transcriptLoader,
	abilityLoader,
}: {
	transcriptLoader: Promise<string | null | undefined>
	abilityLoader: Promise<
		Omit<AbilityForResource, 'canView'> & {
			canViewWorkshop: boolean
			canViewLesson: boolean
			isPendingOpenAccess: boolean
		}
	>
}) {
	const ability = use(abilityLoader)
	const canView = ability?.canViewLesson
	const { muxPlayerRef } = useMuxPlayer()

	if (!canView) {
		return null
	}
	let transcript = use(transcriptLoader)

	if (!transcript) {
		return null
	}

	return (
		<Accordion type="single" collapsible className="">
			<AccordionItem
				value="transcript"
				className="last:border-b-1 rounded border bg-transparent px-5"
			>
				<AccordionTrigger className="flex w-full items-center justify-start gap-2 text-lg font-medium sm:text-xl">
					<FileText className="rotate-0! size-4 opacity-75" /> Video Transcript
				</AccordionTrigger>
				<AccordionContent>
					<ReactMarkdown
						components={{
							p: ({ children }) =>
								paragraphWithTimestampButtons({
									children,
									canShowVideo: canView,
									muxPlayerRef,
								}),
						}}
						className="prose dark:prose-invert max-w-none pt-3 opacity-80"
					>
						{transcript}
					</ReactMarkdown>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	)
}

const paragraphWithTimestampButtons = ({
	children,
	canShowVideo,
	muxPlayerRef,
}: {
	children: React.ReactNode
	canShowVideo: boolean
	muxPlayerRef: React.RefObject<MuxPlayerRefAttributes | null> | null
}) => {
	const elements = React.Children.toArray(children)
	const updatedChildren = elements.map((child, index) => {
		if (typeof child === 'string') {
			const text = child
			const timestampRegex = /(\d+:\d+)/
			const matches = text.match(timestampRegex)
			if (matches) {
				const timestamp = matches[1]
				const beforeText = text.split(matches[0])[0]
				const afterText = text.split(matches[0])[1]
				return (
					<span key={index}>
						{beforeText?.replace('[', '')}
						{canShowVideo ? (
							<button
								data-timestamp=""
								className="after:content-[' '] inline-block underline after:inline-block"
								onClick={() => {
									if (muxPlayerRef?.current) {
										muxPlayerRef.current.currentTime = hmsToSeconds(timestamp)
										muxPlayerRef.current.play()
										window.scrollTo({ top: 0 })
									}
								}}
							>
								{timestamp}
							</button>
						) : (
							timestamp
						)}
						{afterText?.replace(']', '')}
					</span>
				)
			}
		}
		return child
	})
	return <p>{updatedChildren}</p>
}

export function hmsToSeconds(str: any) {
	let p = str.split(':'),
		s = 0,
		m = 1

	while (p.length > 0) {
		s += m * parseInt(p.pop(), 10)
		m *= 60
	}
	return s
}
