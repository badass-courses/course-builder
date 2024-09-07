'use client'

import * as React from 'react'
import { WorkshopNavigation } from '@/lib/workshops'

const WorkshopNavigationContext =
	React.createContext<WorkshopNavigation | null>(null)

export const WorkshopNavigationProvider = ({
	children,
	workshopNavDataLoader,
}: {
	children: React.ReactNode
	workshopNavDataLoader: Promise<WorkshopNavigation | null>
}) => {
	const workshopNavigation = React.use(workshopNavDataLoader)
	return (
		<WorkshopNavigationContext.Provider value={workshopNavigation}>
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
