'use client'

import { WorkshopNavigationProvider } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import type { ResourceNavigation } from '@/lib/content-navigation'
import type { Workshop } from '@/lib/workshops'

import type { ContentResource } from '@coursebuilder/core/schemas'

import { WorkshopLessonList } from './workshop-lesson-list'

export const WorkshopListRowRenderer = ({
	workshopNavDataLoader,
	workshop,
	className,
}: {
	workshopNavDataLoader: Promise<ResourceNavigation | null>
	workshop: Workshop
	className?: string
}) => {
	return (
		<WorkshopNavigationProvider workshopNavDataLoader={workshopNavDataLoader}>
			<WorkshopLessonList workshop={workshop} className={className} />
		</WorkshopNavigationProvider>
	)
}
