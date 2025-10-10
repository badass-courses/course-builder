import React from 'react'
import { ModuleProgressProvider } from '@/app/(content)/_components/module-progress-provider'
import { WorkshopNavigationProvider } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import { getModuleProgressForUser } from '@/lib/progress'
import { getCachedWorkshopNavigation } from '@/lib/workshops-query'

const ModuleLayout = async (props: {
	params: Promise<{ module: string }>
	children: React.ReactNode
}) => {
	const params = await props.params

	const { children } = props

	const workshopNavDataLoader = getCachedWorkshopNavigation(params.module)
	const moduleProgressLoader = getModuleProgressForUser(params.module)
	return (
		<WorkshopNavigationProvider workshopNavDataLoader={workshopNavDataLoader}>
			<ModuleProgressProvider moduleProgressLoader={moduleProgressLoader}>
				{children}
			</ModuleProgressProvider>
		</WorkshopNavigationProvider>
	)
}

export default ModuleLayout
