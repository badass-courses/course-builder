'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@coursebuilder/ui/utils/cn'

import { CldImage } from '../cld-image'

export default function HeroVideo({ className }: { className?: string }) {
	const videoRef = useRef<HTMLVideoElement>(null)
	const [videoLoaded, setVideoLoaded] = useState(false)

	useEffect(() => {
		const video = videoRef.current
		if (!video) return

		video.playbackRate = 1.5

		// Safari needs explicit load() + play()
		video.load()
		video.play().catch(() => {
			// Autoplay blocked
		})

		// Fallback: if video has data but events didn't fire
		const checkReady = () => {
			if (video.readyState >= 2) {
				setVideoLoaded(true)
			}
		}
		checkReady()
		const interval = setInterval(checkReady, 100)

		return () => clearInterval(interval)
	}, [])

	return (
		<div
			className={cn('relative -z-50 max-w-[250px] sm:max-w-full', className)}
		>
			<CldImage
				src="https://res.cloudinary.com/dbdlunqwz/image/upload/v1770022798/eye-video-placeholder_2x_eqqjwi.png"
				alt="Eye"
				width={624 / 2}
				height={400 / 2}
				className={cn('absolute inset-0', {
					'opacity-0': videoLoaded,
					'opacity-100': !videoLoaded,
				})}
				preload={true}
				quality={100}
				format="auto"
				fetchPriority="high"
				loading="eager"
			/>
			<video
				ref={videoRef}
				src="https://res.cloudinary.com/dbdlunqwz/video/upload/v1770022403/compressed-video_1_aighon.mp4"
				width={624 / 2}
				height={400 / 2}
				loop
				autoPlay
				muted
				playsInline
				preload="auto"
				className={cn('relative z-0 shrink-0', {
					'opacity-100': videoLoaded,
					'opacity-0': !videoLoaded,
				})}
				onLoadedData={() => setVideoLoaded(true)}
			/>
		</div>
	)
}
