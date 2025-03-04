'use client'

import React from 'react'
import Image from 'next/image'
import { cn } from '@/utils/cn'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * A carousel component that cycles through images with a pixelated transition effect.
 *
 * @returns A carousel component with a pixelated reveal transition between images
 */
export default function PixelatedImageCarousel() {
	const images = [
		'https://res.cloudinary.com/total-typescript/image/upload/v1740986689/aihero.dev/assets/hero-1_ght0uc.jpg',
		// 'https://res.cloudinary.com/total-typescript/image/upload/v1740986689/aihero.dev/assets/hero-2_gbwgpp.jpg',
		'https://res.cloudinary.com/total-typescript/image/upload/v1740986689/aihero.dev/assets/hero-3_nal1rn.jpg',
		'https://res.cloudinary.com/total-typescript/image/upload/v1741067743/aihero.dev/assets/hero-4_nzoyu6.jpg',
		'https://res.cloudinary.com/total-typescript/image/upload/v1741083586/aihero.dev/assets/hero-5_2x_jqloft.jpg',
		'https://res.cloudinary.com/total-typescript/image/upload/v1741083585/aihero.dev/assets/hero-6_2x_ova0mu.jpg',
		'https://res.cloudinary.com/total-typescript/image/upload/v1741083588/aihero.dev/assets/hero-7_2x_ouothr.jpg',
		'https://res.cloudinary.com/total-typescript/image/upload/v1741083587/aihero.dev/assets/hero-8_2x_w0bnxf.jpg',
		'https://res.cloudinary.com/total-typescript/image/upload/v1741083585/aihero.dev/assets/hero-9_2x_lhz69l.jpg',
		'https://res.cloudinary.com/total-typescript/image/upload/v1741083588/aihero.dev/assets/hero-10_2x_sxxxb9.jpg',
	] as const

	// Track the current index in the images array
	const [currentIndex, setCurrentIndex] = React.useState(0)
	// Track transition state
	const [isTransitioning, setIsTransitioning] = React.useState(false)
	// Track when transition is almost complete to prevent flickering
	const [isTransitionEnding, setIsTransitionEnding] = React.useState(false)
	// Ref to store timeouts for cleanup
	const timeoutsRef = React.useRef<number[]>([])

	// Get current and next images based on the full array
	const currentImage = images[currentIndex] as string
	const nextIndex = (currentIndex + 1) % images.length
	const nextImage = images[nextIndex] as string

	// Clean up all timeouts on unmount
	React.useEffect(() => {
		return () => {
			timeoutsRef.current.forEach((id) => window.clearTimeout(id))
			timeoutsRef.current = []
		}
	}, [])

	// Handle transition completion - simplified to reduce state changes
	const handleTransitionComplete = React.useCallback(() => {
		console.log('Transition complete, updating to next image', nextIndex)

		// Use a single timeout with a slightly longer delay
		const timeout = window.setTimeout(() => {
			// Update all states at once to reduce render cycles
			setCurrentIndex(nextIndex)
			setIsTransitioning(false)
			setIsTransitionEnding(false)
		}, 200)

		timeoutsRef.current.push(timeout)

		// Mark transition as ending
		setIsTransitionEnding(true)
	}, [nextIndex])

	// Start automatic transitions
	React.useEffect(() => {
		if (isTransitioning || isTransitionEnding) return

		const timer = window.setTimeout(() => {
			console.log(
				'Starting transition from index',
				currentIndex,
				'to',
				nextIndex,
			)
			setIsTransitioning(true)
		}, 3000) // 3 seconds between transitions

		timeoutsRef.current.push(timer)

		return () => {
			window.clearTimeout(timer)
		}
	}, [currentIndex, isTransitioning, isTransitionEnding, nextIndex])

	// Manual transition trigger for testing
	const triggerTransition = React.useCallback(() => {
		if (isTransitioning || isTransitionEnding) return

		console.log(
			'Manually triggering transition from index',
			currentIndex,
			'to',
			nextIndex,
		)

		setIsTransitioning(true)
	}, [currentIndex, nextIndex, isTransitioning, isTransitionEnding])

	const shouldReduceMotion = useReducedMotion()

	return (
		<div className="relative aspect-[1278/623] h-full w-full overflow-hidden">
			{/* Current image always visible */}
			<div className="absolute inset-0">
				<Image
					priority
					src={shouldReduceMotion ? images[0] : currentImage}
					alt={`AI Hero image ${currentIndex + 1}`}
					width={1278}
					height={623}
					className="h-full w-full"
					quality={100}
				/>
			</div>

			{/* Pixelated transition effect */}
			{(isTransitioning || isTransitionEnding) && !shouldReduceMotion && (
				<PixelGrid
					nextImage={nextImage}
					onComplete={handleTransitionComplete}
					isEnding={isTransitionEnding}
				/>
			)}

			{/* Manual transition button for testing */}
			{/* <button
				onClick={triggerTransition}
				className="absolute bottom-4 right-4 z-20 rounded-full bg-black/50 p-2 text-white"
				aria-label="Next image"
				disabled={isTransitioning || isTransitionEnding}
			>
				Next
			</button> */}

			{/* Image counter indicator */}
			{/* <div className="absolute bottom-4 left-4 z-20 rounded-full bg-black/50 px-3 py-1 text-white">
				{currentIndex + 1} / {images.length}
			</div> */}
		</div>
	)
}

/**
 * A grid component that creates a pixelated reveal effect for transitioning between images
 *
 * @param props - Component properties
 * @param props.nextImage - URL of the next image to reveal
 * @param props.onComplete - Callback function to execute when the transition is complete
 * @param props.isEnding - Whether the transition is ending (showing full next image)
 * @returns A grid of cells that reveal the next image with a pixelated effect
 */
function PixelGrid({
	nextImage,
	onComplete,
	isEnding = false,
}: {
	nextImage: string
	onComplete?: () => void
	isEnding?: boolean
}) {
	// Create a grid of cells for the pixelated effect
	const columns = 30 // More columns for a more detailed effect
	const rows = 12 // Adjusted for aspect ratio
	const totalCells = columns * rows

	// Track completion
	const completedCellsRef = React.useRef(0)
	const hasCalledCompleteRef = React.useRef(false)
	// Ref to store timeouts for cleanup
	const timeoutsRef = React.useRef<number[]>([])

	// Reset completion tracking on mount
	React.useEffect(() => {
		completedCellsRef.current = 0
		hasCalledCompleteRef.current = false

		return () => {
			// Clean up all timeouts on unmount
			timeoutsRef.current.forEach((id) => window.clearTimeout(id))
			timeoutsRef.current = []
		}
	}, [])

	// Handle cell animation complete
	const handleCellComplete = React.useCallback(() => {
		if (hasCalledCompleteRef.current) return

		completedCellsRef.current += 1

		// When all cells have completed, call onComplete
		if (completedCellsRef.current >= totalCells * 0.9 && onComplete) {
			hasCalledCompleteRef.current = true
			onComplete()
		}
	}, [onComplete, totalCells])

	// Fallback timer to ensure completion
	React.useEffect(() => {
		const timer = window.setTimeout(() => {
			if (!hasCalledCompleteRef.current && onComplete) {
				console.log('Fallback timer triggered for transition completion')
				hasCalledCompleteRef.current = true
				onComplete()
			}
		}, 1800) // Slightly longer than the longest animation

		timeoutsRef.current.push(timer)

		return () => {
			window.clearTimeout(timer)
		}
	}, [onComplete])

	// Create a pattern for revealing cells - using a more structured approach
	const createRevealPattern = React.useCallback(() => {
		// Create a structured pattern that reveals from center outward
		const centerX = Math.floor(columns / 2)
		const centerY = Math.floor(rows / 2)

		// Calculate distance from center for each cell
		const distances = Array.from({ length: totalCells }, (_, i) => {
			const x = i % columns
			const y = Math.floor(i / columns)
			// Manhattan distance from center
			return Math.abs(x - centerX) + Math.abs(y - centerY)
		})

		// Sort indices by distance (with some randomness for visual interest)
		return Array.from({ length: totalCells }, (_, i) => i).sort((a, b) => {
			const distA = distances[a] || 0
			const distB = distances[b] || 0
			// Add slight randomness to the pattern
			const randomFactor = Math.random() * 0.3 - 0.15 // -0.15 to 0.15
			return distA + randomFactor - distB
		})
	}, [columns, rows, totalCells])

	// Memoize the reveal pattern
	const revealPattern = React.useMemo(createRevealPattern, [
		createRevealPattern,
	])

	return (
		<div className="absolute inset-0 z-10">
			{/* Full next image (shown when transition is ending) */}
			<div
				className={cn('absolute inset-0 z-20', {
					'opacity-100': isEnding,
					'opacity-0': !isEnding,
				})}
			>
				<Image
					quality={100}
					src={nextImage}
					alt=""
					fill
					className=""
					priority
				/>
			</div>

			{/* Grid of image cells that reveal */}
			<div
				className="grid h-full w-full"
				style={{
					gridTemplateColumns: `repeat(${columns}, 1fr)`,
					gridTemplateRows: `repeat(${rows}, 1fr)`,
					opacity: isEnding ? 0 : 1, // Hide grid when showing full image
					transition: 'opacity 0.15s ease-out',
				}}
			>
				{Array.from({ length: totalCells }).map((_, i) => {
					// Calculate row and column for this cell
					const col = i % columns
					const row = Math.floor(i / columns)

					// Get position in reveal sequence
					const revealIndex = revealPattern.indexOf(i)
					const normalizedIndex = revealIndex / totalCells

					// Create a wave-like pattern of delays
					const delay = normalizedIndex * 1.5 // Spread over 1.5 seconds

					return (
						<div key={i} className="relative overflow-hidden">
							<motion.div
								className="absolute inset-0"
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{
									duration: 0.5,
									delay,
									ease: 'easeOut',
								}}
								onAnimationComplete={handleCellComplete}
								style={{
									transformOrigin: 'center',
									backgroundColor: 'transparent',
								}}
							>
								<div className="h-full w-full overflow-hidden">
									<div
										className="absolute inset-0"
										style={{
											backgroundImage: `url(${nextImage})`,
											backgroundSize: `${columns * 100}% ${rows * 100}%`,
											backgroundPosition: `${col * (100 / (columns - 1))}% ${row * (100 / (rows - 1))}%`,
										}}
									/>
								</div>
							</motion.div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
