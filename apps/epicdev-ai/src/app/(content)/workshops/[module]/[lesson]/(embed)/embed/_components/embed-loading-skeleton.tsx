'use client'

import * as React from 'react'
import Image from 'next/image'
import Spinner from '@/components/spinner'

import { cn } from '@coursebuilder/ui/utils/cn'

interface EmbedLoadingSkeletonProps {
	className?: string
	thumbnailUrl?: string
}

/**
 * Loading skeleton component for embed video player
 * Shows a pulsing placeholder while content loads
 */
export function EmbedLoadingSkeleton({
	className,
	thumbnailUrl,
}: EmbedLoadingSkeletonProps) {
	return (
		<div
			className={cn(
				'flex h-full w-full items-center justify-center bg-black',
				className,
			)}
		>
			<div className="relative h-full w-full">
				{/* Background thumbnail if available */}
				{thumbnailUrl && (
					<Image
						fill
						className="pointer-events-none absolute inset-0 z-0 h-full w-full select-none bg-cover object-cover opacity-30 blur-sm"
						src={thumbnailUrl}
						alt="thumbnail"
					/>
				)}

				{/* Video player skeleton */}
				<div className="h-full w-full animate-pulse bg-black/60" />

				{/* Play button overlay */}
				<div className="absolute inset-0 flex items-center justify-center">
					<Spinner className="h-8 w-8 text-white" />
				</div>

				{/* Bottom controls bar skeleton */}
				<div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/50 to-transparent">
					<div className="flex h-full items-center justify-between px-4">
						{/* Progress bar */}
						<div className="flex-1">
							<div className="h-1 animate-pulse rounded bg-neutral-600" />
						</div>

						{/* Control buttons */}
						<div className="ml-4 flex space-x-2">
							<div className="h-6 w-6 animate-pulse rounded bg-neutral-600" />
							<div className="h-6 w-6 animate-pulse rounded bg-neutral-600" />
							<div className="h-6 w-6 animate-pulse rounded bg-neutral-600" />
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
