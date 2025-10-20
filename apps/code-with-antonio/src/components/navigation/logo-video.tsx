'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/utils/cn'
import { useTheme } from 'next-themes'

import { CldImage } from '../cld-image'

interface LogoVideoProps {
	isRoot?: boolean
}

/**
 * Interactive logo component that displays a static image initially,
 * then plays a video animation on hover. Once hovered, the static image
 * is hidden and only the video remains visible.
 */
export const LogoVideo: React.FC<LogoVideoProps> = ({ isRoot = false }) => {
	const { resolvedTheme } = useTheme()
	const logoRef = React.useRef<HTMLSpanElement>(null)
	const lightVideoRef = React.useRef<HTMLVideoElement>(null)
	const darkVideoRef = React.useRef<HTMLVideoElement>(null)
	const reverseTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
	const reverseAnimationRef = React.useRef<number | null>(null)
	const [isVideoLoaded, setIsVideoLoaded] = React.useState(false)
	const [hasBeenHovered, setHasBeenHovered] = React.useState(false)

	const getActiveVideoRef = () => {
		return resolvedTheme === 'dark' ? darkVideoRef : lightVideoRef
	}

	React.useEffect(() => {
		const lightVideo = lightVideoRef.current
		const darkVideo = darkVideoRef.current

		const handleVideoReady = () => {
			setIsVideoLoaded(true)
		}

		// Check if already loaded
		if (
			(lightVideo && lightVideo.readyState >= 3) ||
			(darkVideo && darkVideo.readyState >= 3)
		) {
			setIsVideoLoaded(true)
		}

		// Listen for load events on both videos
		lightVideo?.addEventListener('canplay', handleVideoReady)
		lightVideo?.addEventListener('loadeddata', handleVideoReady)
		darkVideo?.addEventListener('canplay', handleVideoReady)
		darkVideo?.addEventListener('loadeddata', handleVideoReady)

		return () => {
			lightVideo?.removeEventListener('canplay', handleVideoReady)
			lightVideo?.removeEventListener('loadeddata', handleVideoReady)
			darkVideo?.removeEventListener('canplay', handleVideoReady)
			darkVideo?.removeEventListener('loadeddata', handleVideoReady)
		}
	}, [])

	const clearReverseAnimation = () => {
		if (reverseTimeoutRef.current) {
			clearTimeout(reverseTimeoutRef.current)
			reverseTimeoutRef.current = null
		}
		if (reverseAnimationRef.current) {
			cancelAnimationFrame(reverseAnimationRef.current)
			reverseAnimationRef.current = null
		}
	}

	const playReverse = () => {
		const video = getActiveVideoRef().current
		if (!video) return

		const fps = 30
		const frameTime = 1000 / fps

		let lastTime = performance.now()

		const reverseFrame = (currentTime: number) => {
			const deltaTime = currentTime - lastTime

			if (deltaTime >= frameTime) {
				lastTime = currentTime
				video.currentTime = Math.max(0, video.currentTime - frameTime / 1000)

				if (video.currentTime <= 0) {
					video.currentTime = 0
					return
				}
			}

			reverseAnimationRef.current = requestAnimationFrame(reverseFrame)
		}

		reverseAnimationRef.current = requestAnimationFrame(reverseFrame)
	}

	const handleMouseEnter = () => {
		clearReverseAnimation()

		const activeVideo = getActiveVideoRef().current
		if (isVideoLoaded && activeVideo) {
			setHasBeenHovered(true)
			activeVideo.play()
		}
	}

	const handleMouseLeave = () => {
		const activeVideo = getActiveVideoRef().current
		if (activeVideo) {
			activeVideo.pause()

			clearReverseAnimation()

			reverseTimeoutRef.current = setTimeout(() => {
				playReverse()
			}, 300)
		}
	}

	React.useEffect(() => {
		return () => {
			clearReverseAnimation()
		}
	}, [])

	return (
		<span
			ref={logoRef}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			<Link
				prefetch
				tabIndex={isRoot ? -1 : 0}
				href="/"
				className="relative flex size-[77px]"
			>
				<CldImage
					src="https://res.cloudinary.com/dezn0ffbx/image/upload/v1760518174/antonio-waving_2x_sq5xrb.png"
					width={77}
					height={77}
					alt="Code with Antonio"
					className={cn(
						'absolute inset-0 transition-opacity duration-300',
						hasBeenHovered && 'opacity-0',
					)}
				/>
				<video
					ref={lightVideoRef}
					width={77}
					height={77}
					playsInline
					muted
					loop
					preload="auto"
					className="absolute inset-0 block dark:hidden"
				>
					<source
						src="https://res.cloudinary.com/dezn0ffbx/video/upload/v1760519973/social_vojtaholik_httpss.mj.runQHYS71uFze0_character_waving_hand_in__f9dbcc9f-0364-4eb0-bd4c-dc35cbc73a2d_1_uld57k.mp4"
						type="video/mp4"
					/>
				</video>
				<video
					ref={darkVideoRef}
					width={77}
					height={77}
					playsInline
					muted
					loop
					preload="auto"
					className="absolute inset-0 hidden dark:block"
				>
					<source
						src="https://res.cloudinary.com/dezn0ffbx/video/upload/v1760527323/social_vojtaholik_httpss-mj-runQHYS71uFze0_character_waving_hand_in__f9dbcc9f-0364-4eb0-bd4c-dc35cbc73a2d_1_4_mgtnv3.mp4"
						type="video/mp4"
					/>
				</video>
			</Link>
		</span>
	)
}
