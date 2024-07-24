import * as React from 'react'
import Spinner from '@/components/spinner'

export function PlayerContainerSkeleton({
	className = 'flex aspect-video h-full w-full items-center justify-center',
}: {
	className?: string
}) {
	return (
		<div className={className}>
			<Spinner />
		</div>
	)
}
