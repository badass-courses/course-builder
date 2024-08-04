import React from 'react'
import { WorkshopNavigationProvider } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import { ModuleProgressProvider } from '@/app/(content)/workshops/_components/workshop-progress-provider'
import { getModuleProgressForUser } from '@/lib/progress'
import { getWorkshopNavigation } from '@/lib/workshops-query'

const ModuleLayout: React.FC<
	React.PropsWithChildren<{
		params: {
			module: string
		}
	}>
> = async ({ children, params }) => {
	const workshopNavData = await getWorkshopNavigation(params.module)
	const moduleProgressLoader = getModuleProgressForUser(params.module)
	return (
		<WorkshopNavigationProvider workshopNavigation={workshopNavData}>
			<ModuleProgressProvider moduleProgressLoader={moduleProgressLoader}>
				{children}
			</ModuleProgressProvider>
		</WorkshopNavigationProvider>
	)
}

export default ModuleLayout
