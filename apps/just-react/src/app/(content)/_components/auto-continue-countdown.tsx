'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/utils/cn'
import { X } from 'lucide-react'
import { animate, motion, useMotionValue, useTransform } from 'motion/react'

import { Button } from '@coursebuilder/ui'

const COUNTDOWN_SECONDS = 5
// Set to true to skip navigation and loop the animation for UI tweaking
const VISUAL_DEBUG = false

/**
 * Displays a circular countdown timer that auto-navigates to the next resource.
 * Users can cancel the countdown to stay on the current page.
 */
export function AutoContinueCountdown({
	nextUrl,
	className,
}: {
	nextUrl: string | null
	className?: string
}) {
	const router = useRouter()
	const [isCancelled, setIsCancelled] = React.useState(false)

	const progress = useMotionValue(0)
	const secondsRemaining = useTransform(progress, (p) =>
		Math.ceil(COUNTDOWN_SECONDS * (1 - p)),
	)
	const [displaySeconds, setDisplaySeconds] = React.useState(COUNTDOWN_SECONDS)

	// Sync motion value to display state
	React.useEffect(() => {
		const unsubscribe = secondsRemaining.on('change', (v) => {
			setDisplaySeconds(Math.max(1, v))
		})
		return unsubscribe
	}, [secondsRemaining])

	// Animate progress and navigate on complete
	React.useEffect(() => {
		if (!nextUrl || isCancelled) return

		const controls = animate(progress, 1, {
			duration: COUNTDOWN_SECONDS,
			ease: 'linear',
			repeat: VISUAL_DEBUG ? Infinity : 0,
			repeatType: 'loop',
			onComplete: VISUAL_DEBUG
				? undefined
				: () => {
						router.push(nextUrl)
					},
		})

		return () => controls.stop()
	}, [nextUrl, isCancelled, progress, router])

	const circumference = 2 * Math.PI * 40
	const strokeDashoffset = useTransform(
		progress,
		(p) => circumference * (1 - p),
	)

	if (!nextUrl || isCancelled) return null

	return (
		<div
			className={cn('flex flex-col items-center gap-1.5 sm:gap-4', className)}
		>
			<div
				className={cn('flex flex-col items-center gap-1.5 sm:gap-4', className)}
			>
				<div className="relative flex h-12 w-12 items-center justify-center sm:h-24 sm:w-24">
					<svg
						className="absolute h-full w-full -rotate-90"
						viewBox="0 0 100 100"
					>
						{/* Background circle */}
						<circle
							cx="50"
							cy="50"
							r="40"
							fill="none"
							stroke="currentColor"
							strokeWidth="6"
							className="text-white/20"
						/>
						{/* Animated progress circle */}
						<motion.circle
							cx="50"
							cy="50"
							r="40"
							fill="none"
							stroke="currentColor"
							strokeWidth="6"
							strokeLinecap="round"
							className="text-white"
							style={{
								strokeDasharray: circumference,
								strokeDashoffset,
							}}
						/>
					</svg>
					<span className="text-base font-bold text-white sm:text-2xl">
						{displaySeconds}
					</span>
				</div>
				<div className="inline-flex items-center">
					<p className="hidden text-xs text-white/70 sm:block sm:text-sm">
						Auto-playing next...
					</p>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setIsCancelled(true)}
						className="absolute right-3 top-3 h-7 px-2 text-sm text-white/70 underline hover:bg-white/10 hover:text-white sm:static sm:h-9 sm:px-3 sm:text-sm"
					>
						Cancel
					</Button>
				</div>
			</div>
		</div>
	)
}
