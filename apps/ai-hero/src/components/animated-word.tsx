'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

import { cn } from '@coursebuilder/ui/utils/cn'

interface AnimatedTitleProps {
	word: string
	words: string[]
	children: string
}

export const AnimatedTitle = ({
	word,
	words,
	children,
}: AnimatedTitleProps) => {
	const shouldReduceMotion = useReducedMotion()

	// Initialize with the index of the provided word
	const [currentIndex, setCurrentIndex] = useState(() => {
		const index = words.indexOf(word)
		return index >= 0 ? index : 0
	})

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentIndex((prev) => (prev + 1) % words.length)
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
				className={cn('', {
					'sr-only': !shouldReduceMotion,
				})}
			>
				{children}
			</h1>
			<h1
				aria-hidden={'true'}
				className={cn(
					'flex w-full flex-wrap items-baseline justify-center gap-0.5 text-center sm:gap-1.5',
					{
						hidden: shouldReduceMotion,
					},
				)}
			>
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
				<span
					className="relative inline-block overflow-hidden py-0.5 sm:py-1"
					aria-hidden="true"
				>
					<AnimatePresence
					// mode="wait"
					>
						<motion.span
							key={words[currentIndex]}
							initial={{ y: -40, opacity: 0, width: 0 }}
							animate={{
								y: 0,
								opacity: 1,
								width: 'auto',
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
								},
							}}
							exit={{
								y: 40,
								opacity: 0,
								width: 0,
								transition: {
									width: { duration: 0.4 },
									opacity: { duration: 0.3 },
									y: { duration: 0.4 },
								},
							}}
							style={{ display: 'inline-block' }}
							className="absolute left-0"
						>
							{words[currentIndex]}
						</motion.span>
					</AnimatePresence>
					<div className="opacity-0">{words[currentIndex]}</div>
				</span>
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
