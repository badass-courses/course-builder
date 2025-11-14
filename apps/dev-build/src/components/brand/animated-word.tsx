'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

import { cn } from '@coursebuilder/ui/utils/cn'

interface AnimatedTitleProps {
	word: string
	words: string[]
	children: string
	className?: string
}

export const AnimatedTitle = ({
	word,
	words,
	children,
	className,
}: AnimatedTitleProps) => {
	const shouldReduceMotion = useReducedMotion()

	// Initialize with the index of the provided word
	const [currentIndex, setCurrentIndex] = useState(() => {
		const index = words.indexOf(word)
		return index >= 0 ? index : 0
	})

	const [isFirstRender, setIsFirstRender] = useState(true)

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentIndex((prev) => (prev + 1) % words.length)
			setIsFirstRender(false)
		}, 2000)

		return () => clearInterval(interval)
	}, [words.length])

	// Split the children text into parts based on the word to animate
	const parts = children.split(word)
	if (parts.length !== 2) {
		console.warn(
			'AnimatedTitle: The word to animate must appear exactly once in the children text',
		)
		return <h1>{children}</h1>
	}

	// Split the parts into words while preserving spaces
	const beforeWords = parts[0]?.split(/(\s+)/) ?? []
	const afterWords = parts[1]?.split(/(\s+)/) ?? []

	return (
		<>
			<h1
				className={cn(
					className,
					'flex w-full flex-wrap items-baseline justify-center gap-0.5 text-center leading-[1.2] sm:gap-1.5',
					{
						'sr-only': !shouldReduceMotion,
					},
				)}
			>
				{children}
			</h1>
			<h1
				aria-hidden={'true'}
				className={cn(
					className,
					'flex w-full flex-wrap items-baseline justify-center gap-0.5 text-center sm:gap-1.5',
					{
						hidden: shouldReduceMotion,
					},
				)}
			>
				<br className="block lg:hidden" />
				{beforeWords.map((part, i) => (
					<motion.span
						aria-hidden="true"
						key={`before-${i}`}
						layout
						transition={{ duration: 0.5, ease: 'easeInOut' }}
					>
						{part}
					</motion.span>
				))}
				<br className="block lg:hidden" />
				<span
					className="relative inline-block overflow-hidden py-2.5 sm:py-2"
					aria-hidden="true"
				>
					<AnimatePresence
					// mode="wait"
					>
						<motion.span
							key={words[currentIndex]}
							initial={
								isFirstRender
									? {
											y: 0,
											opacity: 1,
											width: 'auto',
											skewX: 0,
											scale: 1,
											rotate: 0,
										}
									: {
											y: -40,
											opacity: 0,
											width: 0,
											skewX: 20,
											scale: 0.8,
											rotate: 5,
										}
							}
							animate={{
								y: 0,
								opacity: 1,
								width: 'auto',
								skewX: 0,
								scale: 1,
								rotate: 0,
								transition: {
									width: {
										duration: 0.4,
										ease: 'easeInOut',
									},
									opacity: {
										duration: 0.3,
										ease: 'easeInOut',
									},
									y: {
										duration: 0.4,
										ease: 'easeInOut',
									},
									skewX: {
										type: 'spring',
										stiffness: 120,
										damping: 12,
										duration: 0.7,
									},
									scale: {
										type: 'spring',
										stiffness: 150,
										damping: 15,
										duration: 0.7,
									},
									rotate: {
										type: 'spring',
										stiffness: 100,
										damping: 10,
										duration: 0.6,
									},
								},
							}}
							exit={{
								y: 40,
								opacity: 0,
								width: 0,
								skewX: -20,
								scale: 0.8,
								rotate: -5,
								transition: {
									width: { duration: 0.4 },
									opacity: { duration: 0.3 },
									y: { duration: 0.4 },
									skewX: {
										type: 'spring',
										stiffness: 120,
										damping: 12,
										duration: 0.7,
									},
									scale: {
										type: 'spring',
										stiffness: 150,
										damping: 15,
										duration: 0.7,
									},
									rotate: {
										type: 'spring',
										stiffness: 100,
										damping: 10,
										duration: 0.6,
									},
								},
							}}
							style={{ display: 'inline-block', transformOrigin: 'center' }}
							className="absolute left-0"
						>
							{words[currentIndex]}
						</motion.span>
					</AnimatePresence>
					<div className="opacity-0">{words[currentIndex]}</div>
				</span>
				<div className="flex w-full" />
				{afterWords.map((part, i) => (
					<motion.span
						aria-hidden="true"
						key={`after-${i}`}
						layout
						transition={{ duration: 0.5, ease: 'easeInOut' }}
					>
						{part}
					</motion.span>
				))}
			</h1>
		</>
	)
}
