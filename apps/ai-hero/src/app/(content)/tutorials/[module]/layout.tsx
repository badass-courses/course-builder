import React from 'react'
import { ModuleProgressProvider } from '@/app/(content)/_components/module-progress-provider'
import { WorkshopNavigationProvider } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import { getModuleProgressForUser } from '@/lib/progress'
import { getWorkshopNavigation } from '@/lib/workshops-query'

const ModuleLayout: React.FC<
	React.PropsWithChildren<{
		params: Promise<{
			module: string
		}>
	}>
> = async (props) => {
	const params = await props.params

	const { children } = props

	const workshopNavDataLoader = getWorkshopNavigation(params.module, 'tutorial')
	const moduleProgressLoader = getModuleProgressForUser(params.module)
	return (
		<WorkshopNavigationProvider workshopNavDataLoader={workshopNavDataLoader}>
			<ModuleProgressProvider moduleProgressLoader={moduleProgressLoader}>
				{children}
			</ModuleProgressProvider>
		</WorkshopNavigationProvider>
	)
}

export default ModuleLayout``
