'use client'

import { useState } from 'react'
import { Ticker } from '@/components/ticker'
import { motion, useScroll, useTransform } from 'motion/react'

import { cn } from '@coursebuilder/ui/utils/cn'

export default function TickerDraggable({ className }: { className?: string }) {
	const { scrollY } = useScroll()
	const [currentItem, setCurrentItem] = useState('Mario Kart 64')

	const reverseOffset = useTransform(() => scrollY.get() * -1)

	return (
		<>
			<Ticker
				gap={10}
				className={cn('h-16 w-full', className)}
				items={[<span className="bg-border h-full w-px" key={currentItem} />]}
				offset={scrollY}
			/>
		</>
	)
}
