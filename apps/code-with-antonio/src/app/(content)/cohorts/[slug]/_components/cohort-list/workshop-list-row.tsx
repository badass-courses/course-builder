'use client'

import { WorkshopNavigationProvider } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import type { Workshop, WorkshopNavigation } from '@/lib/workshops'

import { WorkshopLessonList } from './workshop-lesson-list'

export const WorkshopListRowRenderer = ({
	workshopNavDataLoader,
	workshop,
	className,
}: {
	workshopNavDataLoader: Promise<WorkshopNavigation | null>
	workshop: Workshop
	className?: string
}) => {
	return (
		<WorkshopNavigationProvider workshopNavDataLoader={workshopNavDataLoader}>
			<WorkshopLessonList workshop={workshop} className={className} />
		</WorkshopNavigationProvider>
	)
}
