'use client'

import * as React from 'react'
import { WorkshopNavigation } from '@/lib/workshops'

const WorkshopNavigationContext =
	React.createContext<WorkshopNavigation | null>(null)

export const WorkshopNavigationProvider = ({
	children,
	workshopNavigation,
}: {
	children: React.ReactNode
	workshopNavigation: WorkshopNavigation | null
}) => {
	return (
		<WorkshopNavigationContext.Provider value={workshopNavigation}>
			{children}
		</WorkshopNavigationContext.Provider>
	)
}

export const useWorkshopNavigation = () => {
	const context = React.useContext(WorkshopNavigationContext)
	if (!context) {
		throw new Error(
			'useWorkshopNavigation must be used within a WorkshopNavigationProvider',
		)
	}
	return context
}
