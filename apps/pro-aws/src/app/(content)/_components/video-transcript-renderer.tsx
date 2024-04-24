'use client'

import React, { use } from 'react'
import { useMuxPlayer } from '@/hooks/use-mux-player'
import type { MuxPlayerRefAttributes } from '@mux/mux-player-react'
import ReactMarkdown from 'react-markdown'

import type { ContentResource } from '@coursebuilder/core/types'

export async function Transcript({
	lessonLoader,
}: {
	lessonLoader: Promise<ContentResource | null | undefined>
}) {
	const lesson = use(lessonLoader)
	const transcript = lesson?.resources?.[0]?.resource?.fields?.transcript
	const { muxPlayerRef } = useMuxPlayer()

	const canShowVideo = true // TODO: Determine if video is available

	return (
		<div className="pt-16">
			<div className="mb-5 flex w-full items-center gap-2">
				<h3 className="font-heading text-2xl font-bold leading-none text-white">
					Transcript
				</h3>
				<div className="bg-border h-px w-full" aria-hidden="true" />
			</div>
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
		</div>
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
