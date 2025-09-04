'use client'

import React from 'react'
import { cn } from '@/utils/cn'
import { useReducedMotion } from 'framer-motion'
import { useWindowSize } from 'react-use'
import { StarField } from 'starfield-react'

const Starfield: React.FC<{ speed?: number; className?: string }> = ({
	speed = 0.5,
	className,
}) => {
	const { width, height } = useWindowSize()
	const [mounted, setMounted] = React.useState(false)
	React.useEffect(() => {
		setMounted(true)
	}, [])
	const shouldReduceMotion = useReducedMotion()

	return (
		<div
			aria-hidden="true"
			className={cn(
				'pointer-events-none fixed left-0 top-0 h-full w-full select-none overflow-hidden opacity-90',
				className,
			)}
		>
			{mounted && (
				<StarField
					fps={60}
					width={width}
					height={height}
					speed={shouldReduceMotion ? 0 : speed}
					noBackground
				/>
			)}
		</div>
	)
}

export default Starfield
