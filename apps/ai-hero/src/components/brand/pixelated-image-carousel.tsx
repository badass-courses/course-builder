'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { cn } from '@/utils/cn'
import { motion } from 'framer-motion'

import { CldImage } from '../cld-image'

/**
 * A simplified image carousel that cycles through images with a pixelated mask transition.
 * Uses CldImage with SVG masks for the transition effect.
 * All images are preloaded
 */
export default function ImageCarousel() {
	const images = [
		'https://res.cloudinary.com/total-typescript/image/upload/v1740986689/aihero.dev/assets/hero-1_ght0uc.jpg',
		'https://res.cloudinary.com/total-typescript/image/upload/v1740986689/aihero.dev/assets/hero-3_nal1rn.jpg',
		'https://res.cloudinary.com/total-typescript/image/upload/v1741067743/aihero.dev/assets/hero-4_nzoyu6.jpg',
		'https://res.cloudinary.com/total-typescript/image/upload/v1741083586/aihero.dev/assets/hero-5_2x_jqloft.jpg',
		'https://res.cloudinary.com/total-typescript/image/upload/v1741083585/aihero.dev/assets/hero-6_2x_ova0mu.jpg',
		'https://res.cloudinary.com/total-typescript/image/upload/v1741083588/aihero.dev/assets/hero-7_2x_ouothr.jpg',
		'https://res.cloudinary.com/total-typescript/image/upload/v1741083587/aihero.dev/assets/hero-8_2x_w0bnxf.jpg',
		'https://res.cloudinary.com/total-typescript/image/upload/v1741083585/aihero.dev/assets/hero-9_2x_lhz69l.jpg',
		'https://res.cloudinary.com/total-typescript/image/upload/v1741083588/aihero.dev/assets/hero-10_2x_sxxxb9.jpg',
	] as const

	// Simple state management
	const [activeIndex, setActiveIndex] = useState(0)
	const [nextIndex, setNextIndex] = useState(1)
	const [isTransitioning, setIsTransitioning] = useState(false)
	const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({})

	// Transition timing
	const transitionDuration = 0.5
	const maxPixelDelay = 5 * transitionDuration // Maximum delay for the furthest pixels
	const transitionDelay = 3000 // ms between transitions

	// Handle image load events
	const handleImageLoad = (index: number) => {
		setLoadedImages((prev) => ({
			...prev,
			[index]: true,
		}))
	}

	// Auto-advance carousel
	useEffect(() => {
		if (isTransitioning) return // Prevent multiple transitions

		const timer = setTimeout(() => {
			// Only start transition if the next image is loaded
			if (loadedImages[nextIndex]) {
				// Start transition
				setIsTransitioning(true)

				// After transition completes, move to next image
				const transitionTimer = setTimeout(
					() => {
						setActiveIndex(nextIndex)
						setNextIndex((nextIndex + 1) % images.length)
						setIsTransitioning(false)
					},
					(maxPixelDelay + transitionDuration) * 1000 + 100,
				) // Full transition time + buffer

				return () => clearTimeout(transitionTimer)
			} else {
				// If next image isn't loaded yet, check again in a second
				console.log('Next image not loaded yet, waiting...')
			}
		}, transitionDelay)

		return () => clearTimeout(timer)
	}, [
		activeIndex,
		nextIndex,
		isTransitioning,
		maxPixelDelay,
		transitionDuration,
		loadedImages,
		images.length,
	])

	// Generate pixel grid for the mask
	const generatePixelGrid = () => {
		const columns = 25
		const rows = 10
		const pixels = []
		const centerX = Math.floor(columns / 2)
		const centerY = Math.floor(rows / 2)

		for (let y = 0; y < rows; y++) {
			for (let x = 0; x < columns; x++) {
				// Calculate distance from center
				const distance = Math.sqrt(
					Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2),
				)
				// Add a deterministic offset based on position
				const offset = ((x + y) % 3) * 0.1 - 0.15 // Creates a repeating pattern

				pixels.push({
					x,
					y,
					distance: distance + offset,
				})
			}
		}

		// Sort by distance from center
		return pixels.sort((a, b) => a.distance - b.distance)
	}

	const pixelGrid = useMemo(generatePixelGrid, [])

	// Fixed mask ID to avoid type issues
	const maskId = 'pixelated-mask'

	return (
		<div className="aspect-1278/623 relative overflow-hidden">
			{/* SVG with mask definitions */}
			<svg className="absolute h-full w-full overflow-hidden">
				<defs>
					<mask id={maskId}>
						<rect width="100%" height="100%" fill="black" />
						<g>
							{pixelGrid.map((pixel, i) => (
								<motion.rect
									key={`${pixel.x}-${pixel.y}-${activeIndex}`}
									x={`${(pixel.x / 25) * 100}%`}
									y={`${(pixel.y / 10) * 100}%`}
									width={`${100 / 25}%`}
									height={`${100 / 10}%`}
									fill="white"
									strokeWidth={1}
									stroke="white"
									initial={{ opacity: 0 }}
									animate={{ opacity: isTransitioning ? 1 : 0 }}
									transition={{
										duration: transitionDuration,
										delay: (pixel.distance / 5) * transitionDuration,
									}}
								/>
							))}
						</g>
					</mask>
				</defs>
			</svg>

			{/* Preload all images but control visibility */}
			{images.map((src, index) => {
				const isActive = index === activeIndex
				const isNext = index === nextIndex
				const alt = `Carousel Image ${index + 1}`

				// If it's neither the active nor next image and already loaded, don't render
				if (!isActive && !isNext && loadedImages[index]) {
					return null
				}

				return (
					<React.Fragment key={`image-${index}`}>
						{/* Current visible image */}

						<div
							className={cn('absolute h-full w-full', {
								'opacity-0': !isActive,
							})}
						>
							<CldImage
								src={src}
								alt={alt}
								onLoad={() => handleImageLoad(index)}
								priority={index < 2} // Only prioritize first two images
								fill
								className="h-full w-full object-cover"
								sizes="100vw"
							/>
						</div>

						{/* Next image with mask (only rendered when needed) */}

						<div
							className={cn('absolute h-full w-full', {
								'opacity-0': !isTransitioning && !isNext,
							})}
						>
							<CldImage
								src={src}
								alt={alt}
								onLoad={() => handleImageLoad(index)}
								priority={index < 2} // Only prioritize first two images
								fill
								className="h-full w-full object-cover"
								style={{ maskImage: `url(#${maskId})` }}
								sizes="100vw"
							/>
						</div>

						{/* Preload other images invisibly */}
						{!isActive && !isNext && !loadedImages[index] && (
							<div className="absolute h-0 w-0 overflow-hidden opacity-0">
								<CldImage
									src={src}
									alt={alt}
									onLoad={() => handleImageLoad(index)}
									fill
									className="h-full w-full object-cover"
									sizes="100vw"
								/>
							</div>
						)}
					</React.Fragment>
				)
			})}
		</div>
	)
}
