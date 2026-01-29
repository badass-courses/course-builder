'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

import { cn } from '@coursebuilder/ui/utils/cn'

export default function HeroVideo() {
	const videoRef = useRef<HTMLVideoElement>(null)
	const [videoLoaded, setVideoLoaded] = useState(false)

	useEffect(() => {
		if (videoRef.current) {
			videoRef.current.playbackRate = 1.5
		}
	}, [])

	return (
		<div className="relative">
			<Image
				src="/assets/eye-videoplaceholder@2x.png"
				alt="Eye"
				width={278}
				height={278}
				className={cn('absolute inset-0', {
					'opacity-0': videoLoaded,
					'opacity-100': !videoLoaded,
				})}
			/>
			<video
				ref={videoRef}
				src="/assets/eye.mp4"
				loop
				autoPlay
				muted
				width={278}
				height={278}
				className={cn('relative z-0 shrink-0', {
					'opacity-100': videoLoaded,
					'opacity-0': !videoLoaded,
				})}
				onCanPlay={() => setVideoLoaded(true)}
			/>
		</div>
	)
}
