'use client'

import * as React from 'react'
import { motion, useAnimation } from 'framer-motion'
import { twMerge } from 'tailwind-merge'

type Variant = {
	[key: string]: string | number
}

type Variants = {
	sticked: Variant
	default: Variant
}

interface FloatingActionsBarProps {
	children: React.ReactNode
	offset?: number
	className?: string
	variants?: Variants
}

const FloatingActionsBar: React.FC<FloatingActionsBarProps> = ({
	children,
	offset = 44,
	className = '',
	variants,
}) => {
	const controls = useAnimation()
	const stickyRef = React.useRef<HTMLDivElement>(null)
	const [isSticky, setIsSticky] = React.useState<boolean>(false)

	const defaultVariants = {
		sticked: { top: 8 },
		default: { top: offset },
	}

	React.useEffect(() => {
		const checkPosition = () => {
			const scrollPosition = window.scrollY
			if (scrollPosition >= offset && !isSticky) {
				setIsSticky(true)
				controls.start('sticked')
			} else if (scrollPosition < offset && isSticky) {
				setIsSticky(false)
				controls.start('default')
			}
		}

		window.addEventListener('scroll', checkPosition)
		return () => {
			window.removeEventListener('scroll', checkPosition)
		}
	}, [isSticky, controls, offset])

	return (
		<motion.div
			ref={stickyRef}
			className={twMerge(
				'bg-muted fixed right-2 z-10 flex items-center justify-end space-x-2 rounded-sm p-2',
				className,
			)}
			animate={controls}
			initial="default"
			variants={variants || defaultVariants}
		>
			{children}
		</motion.div>
	)
}

export default FloatingActionsBar
