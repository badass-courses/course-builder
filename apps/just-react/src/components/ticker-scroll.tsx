'use client'

import { Ticker } from '@/components/ticker'
import { useScroll, useTransform } from 'motion/react'

import { cn } from '@coursebuilder/ui/utils/cn'

interface TickerScrollProps {
	className?: string
	/** Speed multiplier - values > 1 = faster, < 1 = slower, negative = reverse */
	speed?: number
	/** Reverse the scroll direction */
	reverse?: boolean
}

export default function TickerScroll({
	className,
	speed = 0.2,
	reverse = false,
	...props
}: TickerScrollProps) {
	const { scrollY } = useScroll()

	const scaledOffset = useTransform(
		() => scrollY.get() * speed * (reverse ? -1 : 1),
	)

	return (
		<Ticker
			gap={6}
			className={cn('h-16 w-full', className)}
			items={[<span className="bg-border h-full w-px" key="ticker-scroll" />]}
			offset={scaledOffset}
			{...props}
		/>
	)
}
