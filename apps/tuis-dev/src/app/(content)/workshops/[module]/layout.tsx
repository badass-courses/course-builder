import React from 'react'
import { ModuleProgressProvider } from '@/app/(content)/_components/module-progress-provider'
import { ContentNavigationProvider } from '@/app/(content)/_components/navigation/provider'
import { getModuleProgressForUser } from '@/lib/progress'
import {
	getCachedMinimalWorkshop,
	getCachedWorkshopNavigation,
} from '@/lib/workshops-query'

/**
 * Workshop module layout with navigation and progress providers.
 */
const ModuleLayout = async (props: {
	params: Promise<{ module: string }>
	children: React.ReactNode
}) => {
	const params = await props.params

	const { children } = props

	const workshopNavDataLoader = (async () => {
		const workshop = await getCachedMinimalWorkshop(params.module)
		if (!workshop) return null
		return getCachedWorkshopNavigation(workshop.id, {
			caller: 'layout.workshop',
			depth: 2,
		})
	})()

	const moduleProgressLoader = getModuleProgressForUser(params.module)

	return (
		<ContentNavigationProvider navigationDataLoader={workshopNavDataLoader}>
			<ModuleProgressProvider moduleProgressLoader={moduleProgressLoader}>
				{children}
			</ModuleProgressProvider>
		</ContentNavigationProvider>
	)
}

export default ModuleLayout
