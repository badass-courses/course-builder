'use client'

import * as React from 'react'
import type { ResourceNavigation } from '@/lib/content-navigation'

type ContentNavigationContextValue =
	| (ResourceNavigation & {
			isSidebarCollapsed: boolean
			setIsSidebarCollapsed: (collapsed: boolean) => void
	  })
	| null

const ContentNavigationContext =
	React.createContext<ContentNavigationContextValue>(null)

/**
 * Generic content navigation provider
 * Works with any content type (workshop, tutorial, list, etc.)
 * Uses React.use() pattern for async data loading
 */
export const ContentNavigationProvider = ({
	children,
	navigationDataLoader,
}: {
	children: React.ReactNode
	navigationDataLoader: Promise<ResourceNavigation | null>
}) => {
	const navigationData = React.use(navigationDataLoader)
	const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false)

	return (
		<ContentNavigationContext.Provider
			value={
				navigationData
					? { ...navigationData, isSidebarCollapsed, setIsSidebarCollapsed }
					: null
			}
		>
			{children}
		</ContentNavigationContext.Provider>
	)
}

/**
 * Hook to access content navigation from context
 */
export const useContentNavigation = () => {
	const context = React.useContext(ContentNavigationContext)
	if (!context) {
		console.error(
			'useContentNavigation must be used within ContentNavigationProvider',
		)
	}
	return context
}
