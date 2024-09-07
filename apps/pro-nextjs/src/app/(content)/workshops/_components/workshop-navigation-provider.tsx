'use client'

import * as React from 'react'
import { WorkshopNavigation } from '@/lib/workshops'

const WorkshopNavigationContext = React.createContext<
	| (WorkshopNavigation & {
			isSidebarCollapsed: boolean
			setIsSidebarCollapsed: (isSidebarCollapsed: boolean) => void
	  })
	| null
>(null)

export const WorkshopNavigationProvider = ({
	children,
	workshopNavDataLoader,
}: {
	children: React.ReactNode
	workshopNavDataLoader: Promise<WorkshopNavigation | null>
}) => {
	const workshopNavigation = React.use(workshopNavDataLoader)
	const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false)

	return (
		<WorkshopNavigationContext.Provider
			value={
				workshopNavigation
					? { ...workshopNavigation, isSidebarCollapsed, setIsSidebarCollapsed }
					: null
			}
		>
			{children}
		</WorkshopNavigationContext.Provider>
	)
}

export const useWorkshopNavigation = () => {
	const context = React.useContext(WorkshopNavigationContext)
	if (!context) {
		console.error('no workshop navigation data')
	}
	return context
}
