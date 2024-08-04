'use client'

import * as React from 'react'

import { ModuleProgress } from '@coursebuilder/core/schemas'

const ModuleProgressContext = React.createContext<ModuleProgress | null>(null)

export const ModuleProgressProvider = ({
	children,
	moduleProgressLoader,
}: {
	children: React.ReactNode
	moduleProgressLoader: Promise<ModuleProgress | null>
}) => {
	const moduleProgress = React.use(moduleProgressLoader)
	return (
		<ModuleProgressContext.Provider value={moduleProgress}>
			{children}
		</ModuleProgressContext.Provider>
	)
}

export const useModuleProgress = () => {
	const context = React.use(ModuleProgressContext)
	if (!context) {
		throw new Error(
			'useWorkshopNavigation must be used within a WorkshopNavigationProvider',
		)
	}
	return context
}
