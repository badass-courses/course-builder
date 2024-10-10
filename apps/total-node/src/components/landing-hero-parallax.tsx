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
	const platformY = useSpring(useTransform(scrollYProgress, [0, 1], [1, 100]), {
		damping: 20,
		stiffness: 100,
	})
	const platformScale = useSpring(
		useTransform(scrollYProgress, [0, 1], [1, 1.5]),
		{ damping: 20, stiffness: 100 },
	)
	const mazeY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 50]), {
		damping: 20,
		stiffness: 100,
	})
	const cloudsY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 300]), {
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
			}
		case 'maze':
			return {
				y: mazeY,
			}
		case 'beam':
			return {
				y: mazeY,
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
	const scrollAreaRef = React.useRef(null)
	const { scrollYProgress } = useScroll({
		target: scrollAreaRef,
		offset: ['0%', '100%'],
	})

	// Call useStylesForImage for each image individually
	const bgStyles = useStylesForImage('bg', scrollYProgress)
	const mazeStyles = useStylesForImage('maze', scrollYProgress)
	const beamStyles = useStylesForImage('beam', scrollYProgress)
	const cloudsStyles = useStylesForImage('clouds', scrollYProgress)
	const platformStyles = useStylesForImage('platform', scrollYProgress)

	const images = [
		{ name: 'bg', src: '/assets/hero-bg.jpg', styles: bgStyles },
		{ name: 'maze', src: '/assets/hero-maze.png', styles: mazeStyles },
		{ name: 'beam', src: '/assets/hero-beam.png', styles: beamStyles },
		{ name: 'clouds', src: '/assets/hero-clouds.png', styles: cloudsStyles },
		{
			name: 'platform',
			src: '/assets/hero-platform.png',
			styles: platformStyles,
		},
	]

	return (
		<div
			ref={scrollAreaRef}
			className="absolute bottom-0 left-0 aspect-square h-auto w-full overflow-hidden lg:aspect-[1920/1080]"
		>
			{images.map(({ name, src, styles }) => (
				<motion.div
					key={name}
					style={styles}
					transition={{}}
					className="absolute left-0 top-0 h-full w-full"
				>
					<Image
						src={src}
						className={cn('object-cover object-bottom')}
						alt=""
						fill
						priority
					/>
				</motion.div>
			))}
		</div>
	)
}
