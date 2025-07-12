'use client'

import React from 'react'
import Image from 'next/image'
import {
	motion,
	useScroll,
	useSpring,
	useTransform,
	type MotionValue,
} from 'framer-motion'

import { cn } from '@coursebuilder/ui/utils/cn'

function useParallax(value: MotionValue<number>, distance: number) {
	return useTransform(value, [0, 1], [-distance, distance])
}

function useStylesForImage(name: string, scrollYProgress: MotionValue) {
	const platformY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 200]), {
		damping: 20,
		stiffness: 100,
	})
	const platformScale = useSpring(
		useTransform(scrollYProgress, [0, 1], [1, 1.2]),
		{ damping: 20, stiffness: 100 },
	)
	const mazeY = useSpring(useTransform(scrollYProgress, [0, 1], [0, -50]), {
		damping: 20,
		stiffness: 100,
	})
	const cloudsY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 15]), {
		damping: 20,
		stiffness: 100,
	})
	const cloudsScale = useSpring(
		useTransform(scrollYProgress, [0, 1], [1, 1.1]),
		{ damping: 20, stiffness: 100 },
	)

	switch (name) {
		case 'platform':
			return {
				y: platformY,
				scale: platformScale,
				transformOrigin: 'bottom',
				x: -5,
			}
		case 'maze':
			return {
				// y: mazeY,
				scale: cloudsScale,
				filter: 'saturate(0.75)',
			}
		case 'beam':
			return {
				// y: mazeY,
			}
		case 'clouds':
			return {
				y: cloudsY,
				scale: cloudsScale,
			}
		default:
			return {}
	}
}

export const LandingHeroParallax = () => {
	const scrollAreaRef = React.useRef<HTMLDivElement | null>(null)
	const { scrollYProgress } = useScroll({
		target:
			scrollAreaRef.current !== null
				? (scrollAreaRef as React.RefObject<HTMLElement>)
				: undefined,
		offset: ['0%', '100%'],
	})

	// Call useStylesForImage for each image individually
	const bgStyles = useStylesForImage('bg', scrollYProgress)
	const mazeStyles = useStylesForImage('maze', scrollYProgress)
	const beamStyles = useStylesForImage('beam', scrollYProgress)
	const cloudsStyles = useStylesForImage('clouds', scrollYProgress)
	const platformStyles = useStylesForImage('platform', scrollYProgress)

	const images = [
		// { name: 'bg', src: '/assets/hero-bg@2x.jpg', styles: bgStyles },
		{ name: 'maze', src: '/assets/hero-maze@2x.png', styles: mazeStyles },
		{ name: 'beam', src: '/assets/hero-beam@2x.png', styles: beamStyles },
		{ name: 'clouds', src: '/assets/hero-clouds@2x.png', styles: cloudsStyles },
		{
			name: 'platform',
			src: '/assets/hero-platform@2x.png',
			styles: platformStyles,
		},
	]

	// State variables to track image loading
	const [imagesLoaded, setImagesLoaded] = React.useState(0)
	const totalImages = 4 // Update this if you change the number of images
	const [allImagesLoaded, setAllImagesLoaded] = React.useState(false)

	// Update the allImagesLoaded state when all images have loaded
	React.useEffect(() => {
		if (imagesLoaded >= totalImages) {
			setAllImagesLoaded(true)
		}
	}, [imagesLoaded, totalImages])

	// Render a loading indicator until all images are loaded

	return (
		<div
			ref={scrollAreaRef}
			className={cn(
				'lg:aspect-1920/1080 absolute bottom-0 left-0 aspect-square h-auto w-full overflow-hidden bg-[#AD9F95]',
			)}
		>
			{!allImagesLoaded && (
				<Image
					src={require('../../public/assets/hero-loading@2x.jpg')}
					fill
					className="object-cover object-bottom"
					alt=""
					priority
					aria-hidden="true"
				/>
			)}
			{images.map(({ name, src, styles }) => (
				<motion.div
					key={name}
					style={styles}
					transition={{}}
					className={cn('absolute left-0 top-0 h-full w-full', {
						'opacity-0': !allImagesLoaded,
					})}
				>
					<Image
						src={src}
						className={cn('object-cover object-bottom')}
						alt=""
						fill
						// priority
						quality={100}
						onLoadingComplete={() => setImagesLoaded((prev) => prev + 1)}
					/>
				</motion.div>
			))}
		</div>
	)
}
