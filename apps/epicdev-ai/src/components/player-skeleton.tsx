'use client'

import * as React from 'react'
import Spinner from '@/components/spinner'

import { cn } from '@coursebuilder/ui/utils/cn'

export function PlayerContainerSkeleton({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				'flex aspect-video h-full w-full items-center justify-center bg-gray-950',
				className,
			)}
		>
			<Spinner className="text-white" />
		</div>
	)
}
