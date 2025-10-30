'use client'

import {
	ContentNavigationProvider,
	useContentNavigation,
} from '@/components/content-navigation-provider'
import type { NestedContentResource } from '@/lib/content-navigation'

import type { ContentResource } from '@coursebuilder/core/schemas'

/**
 * Workshop-specific navigation provider
 * Thin wrapper around generic ContentNavigationProvider
 */
export const WorkshopNavigationProvider = ({
	children,
	workshopNavDataLoader,
}: {
	children: React.ReactNode
	workshopNavDataLoader: Promise<
		(NestedContentResource & { parents?: ContentResource[] }) | null
	>
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
