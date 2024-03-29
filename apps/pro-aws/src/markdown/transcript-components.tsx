import * as React from 'react'
import { hmsToSeconds } from '@skillrecordings/time'

const getTranscriptComponents = ({
	handlePlay,
	canShowVideo,
	muxPlayerRef,
}: {
	handlePlay: () => void
	canShowVideo: boolean
	muxPlayerRef: any
}) => {
	return {
		p: ({ children }: any) => {
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
											if (muxPlayerRef.current) {
												muxPlayerRef.current.currentTime =
													hmsToSeconds(timestamp)
												handlePlay()
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
		},
	}
}

export { getTranscriptComponents }
