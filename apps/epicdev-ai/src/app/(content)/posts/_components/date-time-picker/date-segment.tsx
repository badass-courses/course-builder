'use client'

import { useRef } from 'react'
import { useDateSegment } from 'react-aria'
import { DateFieldState, DateSegment as IDateSegment } from 'react-stately'

import { cn } from '@coursebuilder/ui/utils/cn'

interface DateSegmentProps {
	segment: IDateSegment
	state: DateFieldState
}

function DateSegment({ segment, state }: DateSegmentProps) {
	const ref = useRef(null)

	const {
		segmentProps: { ...segmentProps },
	} = useDateSegment(segment, state, ref)

	return (
		<div
			{...segmentProps}
			ref={ref}
			className={cn(
				'focus:bg-accent focus:text-accent-foreground focus:outline-hidden focus:rounded-[2px]',
				segment.type !== 'literal' ? 'px-px' : '',
				segment.isPlaceholder ? 'text-muted-foreground' : '',
			)}
		>
			{segment.text}
		</div>
	)
}

export { DateSegment }
