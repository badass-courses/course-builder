'use client'

import React from 'react'
import {
	ContentNavigationProvider,
	useContentNavigation,
} from '@/app/(content)/_components/navigation/provider'
import type { ResourceNavigation } from '@/lib/content-navigation'

/**
 * Workshop-specific navigation provider
 * Thin wrapper around generic ContentNavigationProvider
 */
export const WorkshopNavigationProvider = ({
	children,
	workshopNavDataLoader,
}: {
	children: React.ReactNode
	workshopNavDataLoader: Promise<ResourceNavigation | null>
}) => {
	return (
		<ContentNavigationProvider navigationDataLoader={workshopNavDataLoader}>
			{children}
		</ContentNavigationProvider>
	)
}

/**
 * Workshop-specific hook for accessing navigation
 * Uses the generic useContentNavigation under the hood
 */
export const useWorkshopNavigation = () => {
	return useContentNavigation()
}
