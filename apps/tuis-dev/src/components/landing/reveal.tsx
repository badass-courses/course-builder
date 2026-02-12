'use client'

import { motion, useReducedMotion } from 'motion/react'

export function Reveal({
	children,
	className = '',
	delay = 0,
	y = 16,
	duration = 0.5,
}: {
	children: React.ReactNode
	className?: string
	delay?: number
	y?: number
	duration?: number
}) {
	const reduced = useReducedMotion()

	if (reduced) {
		return <div className={className}>{children}</div>
	}

	return (
		<motion.div
			initial={{ opacity: 0, y }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, amount: 0.15 }}
			transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
			className={className}
		>
			{children}
		</motion.div>
	)
}
