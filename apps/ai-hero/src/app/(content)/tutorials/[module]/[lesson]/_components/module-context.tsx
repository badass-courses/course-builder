'use client'

import * as React from 'react'
import { Module } from '@/lib/module'

const ModuleContext = React.createContext<{
	module: Module | null
}>({ module: null })

export const ModuleProvider = ({
	children,
	moduleLoader,
}: {
	children: React.ReactNode
	moduleLoader: Promise<Module | null>
}) => {
	const contentModule = React.use(moduleLoader)
	return (
		<ModuleContext.Provider value={{ module: contentModule }}>
			{children}
		</ModuleContext.Provider>
	)
}
