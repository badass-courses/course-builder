'use client'

import React, { use } from 'react'
import { LessonContext } from '@/app/(content)/tutorials/[module]/[lesson]/_components/lesson-context'
import { useMuxPlayer } from '@/hooks/use-mux-player'
import type { MuxPlayerRefAttributes } from '@mux/mux-player-react'
import ReactMarkdown from 'react-markdown'

import type { ContentResource } from '@coursebuilder/core/schemas'

export function Transcript({
	resourceLoader,
	withTitle = true,
}: {
	resourceLoader?: Promise<ContentResource | null>
	withTitle?: boolean
}) {
	let lesson
	if (resourceLoader) {
		lesson = use(resourceLoader)
	} else {
		const lessonContext = use(LessonContext)
		lesson = lessonContext?.lesson
	}
	const videoResource = lesson?.resources?.find(
		(resource) => resource.resource.type === 'videoResource',
	)?.resource
	const transcript = videoResource?.fields?.transcript
	const { muxPlayerRef } = useMuxPlayer()

	const canShowVideo = true // TODO: Determine if video is available

	return (
		<div data-video-transcript="">
			{withTitle && <h2 data-title="">Transcript</h2>}
			<div data-transcript="">
				<ReactMarkdown
					components={{
						p: ({ children }) =>
							paragraphWithTimestampButtons({
								children,
								canShowVideo,
								muxPlayerRef,
							}),
					}}
					className="prose dark:prose-invert sm:prose-lg max-w-none pt-4"
				>
					{transcript}
				</ReactMarkdown>
			</div>
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
