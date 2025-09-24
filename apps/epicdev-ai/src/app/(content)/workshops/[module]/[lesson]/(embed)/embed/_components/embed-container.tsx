'use client'

import * as React from 'react'
import { track } from '@/utils/analytics'

interface EmbedContainerProps {
	children: React.ReactNode
	lessonSlug: string
	moduleSlug: string
	isAuthenticated: boolean
}

/**
 * Container component for embed contexts
 * Handles postMessage communication and iframe optimization
 */
export function EmbedContainer({
	children,
	lessonSlug,
	moduleSlug,
	isAuthenticated,
}: EmbedContainerProps) {
	React.useEffect(() => {
		// Track embed load
		track('loaded: embed iframe', {
			lessonSlug,
			moduleSlug,
			isAuthenticated,
			context: 'embed',
		})
	}, [lessonSlug, moduleSlug, isAuthenticated])

	return (
		<div className="flex h-screen w-full items-center justify-center overflow-hidden bg-black">
			{children}
		</div>
	)
}
