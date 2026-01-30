'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@coursebuilder/ui/utils/cn'

import { CldImage } from '../cld-image'

export default function HeroVideo({ className }: { className?: string }) {
	const videoRef = useRef<HTMLVideoElement>(null)
	const [videoLoaded, setVideoLoaded] = useState(false)

	useEffect(() => {
		if (videoRef.current) {
			videoRef.current.playbackRate = 1.5
		}
	}, [])

	return (
		<div className={cn('relative', className)}>
			<CldImage
				src="https://res.cloudinary.com/dbdlunqwz/image/upload/v1769766066/eye-videoplaceholder_2x_r7nqsi.png"
				alt="Eye"
				width={300}
				height={300}
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
				src="https://res.cloudinary.com/dbdlunqwz/video/upload/v1769766067/eye_hzn8pl.mp4"
				loop
				autoPlay
				muted
				width={300}
				height={300}
				playsInline
				preload="auto"
				className={cn('relative z-0 shrink-0', {
					'opacity-100': videoLoaded,
					'opacity-0': !videoLoaded,
				})}
				onCanPlay={() => setVideoLoaded(true)}
			/>
		</div>
	)
}
