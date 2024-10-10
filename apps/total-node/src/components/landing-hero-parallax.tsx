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

export const LandingHeroParallax = () => {
	const scrollAreaRef = React.useRef(null)
	const { scrollY, scrollYProgress } = useScroll({
		target: scrollAreaRef,
		offset: ['0%', '100%'],
	})

	const platformY = useTransform(scrollYProgress, [0, 1], [1, 100])
	const platformScale = useTransform(scrollYProgress, [0, 1], [1, 1.5])
	const mazeY = useTransform(scrollYProgress, [0, 1], [0, 50])
	const cloudsY = useTransform(scrollYProgress, [0, 1], [0, 300])
	const cloudsScale = useTransform(scrollYProgress, [0, 1], [1, 1.1])
	const asSpringValue = (value: MotionValue) =>
		useSpring(value, { damping: 20, stiffness: 100 })

	return (
		<div
			ref={scrollAreaRef}
			className="absolute bottom-0 left-0 aspect-square h-auto w-full overflow-hidden lg:aspect-[1920/1080]"
		>
			{[
				{ name: 'bg', src: '../../public/assets/hero-bg.jpg' },
				{ name: 'maze', src: '../../public/assets/hero-maze.png' },
				{ name: 'beam', src: '../../public/assets/hero-beam.png' },
				{ name: 'clouds', src: '../../public/assets/hero-clouds.png' },
				{ name: 'platform', src: '../../public/assets/hero-platform.png' },
			].map(({ name, src }) => {
				const getStylesForImageName = (name: string) => {
					switch (name) {
						case 'platform':
							return {
								y: asSpringValue(platformY),
								scale: asSpringValue(platformScale),
								transformOrigin: 'bottom',
							}
						case 'maze':
							return {
								y: asSpringValue(mazeY),
							}
						case 'beam':
							return {
								y: asSpringValue(mazeY),
							}
						case 'clouds':
							return {
								y: asSpringValue(mazeY),
								scale: asSpringValue(cloudsScale),
							}
						default:
							return {}
					}
				}

				return (
					<motion.div
						key={name}
						style={getStylesForImageName(name)}
						transition={{}}
						className="absolute left-0 top-0 h-full w-full"
					>
						<Image
							src={require(src)}
							className={cn('object-cover object-bottom')}
							alt=""
							fill
						/>
					</motion.div>
				)
			})}
		</div>
	)
}
