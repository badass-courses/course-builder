import React from 'react'
import { WorkshopNavigationProvider } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import { WorkshopResourceList } from '@/app/(content)/workshops/_components/workshop-resource-list'
import { getWorkshopNavigation } from '@/lib/workshops-query'

import { Skeleton } from '@coursebuilder/ui'

const LessonLayout: React.FC<
	React.PropsWithChildren<{
		params: {
			module: string
			lesson: string
		}
	}>
> = async ({ children, params }) => {
	const workshopNavData = await getWorkshopNavigation(params.module)

	return (
		<WorkshopNavigationProvider workshopNavigation={workshopNavData}>
			<div className="flex">
				<React.Suspense
					fallback={
						<div className="flex w-full max-w-sm flex-shrink-0 flex-col gap-2 border-l p-5">
							<Skeleton className="mb-8 h-8 w-full bg-gray-800" />
							{new Array(10).fill(null).map((_, i) => (
								<Skeleton key={i} className="h-8 w-full bg-gray-800" />
							))}
						</div>
					}
				>
					{workshopNavData && (
						<WorkshopResourceList
							workshopNavigation={workshopNavData}
							currentLessonSlug={params.lesson}
							className="hidden lg:block"
							key={workshopNavData.id}
						/>
					)}
				</React.Suspense>

				{children}
			</div>
		</WorkshopNavigationProvider>
	)
}

export default LessonLayout
