'use client'

import * as React from 'react'
import { useSticky } from '@/hooks/use-sticky'
import { motion, useAnimation } from 'framer-motion'
import { twMerge } from 'tailwind-merge'

type Variant = {
	[key: string]: string | number
}

type Variants = {
	sticked: Variant
	default: Variant
}

const defaultVariants = {
	sticked: { paddingTop: 6, paddingBottom: 6 },
	default: { paddingTop: 10, paddingBottom: 10 },
}

const StickyBlock: React.FC<{
	children: React.ReactNode
	className?: string
	variants?: Variants
}> = ({ children, className = '', variants = defaultVariants }) => {
	const controls = useAnimation()
	const { ref, isSticky } = useSticky()

	React.useEffect(() => {
		if (isSticky) {
			controls.start('sticked')
		} else {
			controls.start('default')
		}
	}, [isSticky, controls])

	return (
		<motion.div
			id="sticky"
			ref={ref}
			className={twMerge('bg-muted sticky top-0 z-10', className)}
			animate={controls}
			initial="default"
			variants={variants}
		>
			{children}
		</motion.div>
	)
}

export default StickyBlock
