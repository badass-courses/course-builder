'use client'

import React from 'react'
import { cn } from '@/utils/cn'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'

const transition = {
	type: 'spring',
	stiffness: 200,
	damping: 10,
}

export const ThemeToggle: React.FC<{ className?: string }> = ({
	className,
}) => {
	const { theme, setTheme } = useTheme()
	const [mounted, setMounted] = React.useState(false)
	React.useEffect(() => {
		setMounted(true)
	}, [])

	return (
		<button
			className={cn(
				'rounded-full p-2 text-gray-700 hover:text-gray-900 dark:bg-transparent dark:text-gray-300 dark:hover:text-white',
				className,
			)}
			onClick={() => {
				mounted && setTheme(theme === 'light' ? 'dark' : 'light')
			}}
		>
			{mounted && theme === 'dark' ? <SunIcon /> : <MoonIcon />}
			{mounted && (
				<span className="sr-only">
					switch to {theme === 'dark' ? 'light' : 'dark'} mode
				</span>
			)}
		</button>
	)
}

export const SunIcon = () => {
	const whileTap = { scale: 0.95, rotate: 15 }

	const raysVariants = {
		initial: { rotate: 45 },
		animate: { rotate: 0, transition },
	}

	const coreVariants = {
		initial: { scale: 1.5 },
		animate: { scale: 1, transition },
	}

	return (
		<motion.svg
			key="sun"
			width="1em"
			height="1em"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			whileTap={whileTap}
			style={{ originX: '50%', originY: '50%' }}
		>
			<motion.circle
				cx="11.9998"
				cy="11.9998"
				r="5.75375"
				fill="currentColor"
				initial="initial"
				animate="animate"
				variants={coreVariants}
			/>
			<motion.g initial="initial" animate="animate" variants={raysVariants}>
				<circle
					cx="3.08982"
					cy="6.85502"
					r="1.71143"
					transform="rotate(-60 3.08982 6.85502)"
					fill="currentColor"
				/>
				<circle
					cx="3.0903"
					cy="17.1436"
					r="1.71143"
					transform="rotate(-120 3.0903 17.1436)"
					fill="currentColor"
				/>
				<circle cx="12" cy="22.2881" r="1.71143" fill="currentColor" />
				<circle
					cx="20.9101"
					cy="17.1436"
					r="1.71143"
					transform="rotate(-60 20.9101 17.1436)"
					fill="currentColor"
				/>
				<circle
					cx="20.9101"
					cy="6.8555"
					r="1.71143"
					transform="rotate(-120 20.9101 6.8555)"
					fill="currentColor"
				/>
				<circle cx="12" cy="1.71143" r="1.71143" fill="currentColor" />
			</motion.g>
		</motion.svg>
	)
}

export const MoonIcon = () => {
	const variants = {
		initial: { scale: 0.6, rotate: 90 },
		animate: { scale: 1, rotate: 0, transition },
		whileTap: { scale: 0.95, rotate: 15 },
	}

	return (
		<motion.svg
			xmlns="http://www.w3.org/2000/svg"
			width="1em"
			height="1em"
			viewBox="0 0 50 50"
			key="moon"
		>
			<motion.path
				d="M 43.81 29.354 C 43.688 28.958 43.413 28.626 43.046 28.432 C 42.679 28.238 42.251 28.198 41.854 28.321 C 36.161 29.886 30.067 28.272 25.894 24.096 C 21.722 19.92 20.113 13.824 21.683 8.133 C 21.848 7.582 21.697 6.985 21.29 6.578 C 20.884 6.172 20.287 6.022 19.736 6.187 C 10.659 8.728 4.691 17.389 5.55 26.776 C 6.408 36.163 13.847 43.598 23.235 44.451 C 32.622 45.304 41.28 39.332 43.816 30.253 C 43.902 29.96 43.9 29.647 43.81 29.354 Z"
				fill="currentColor"
				initial="initial"
				animate="animate"
				whileTap="whileTap"
				variants={variants}
			/>
		</motion.svg>
	)
}
