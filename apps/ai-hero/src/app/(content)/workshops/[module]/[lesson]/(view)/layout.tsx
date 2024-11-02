import React from 'react'
import { WorkshopResourceList } from '@/app/(content)/workshops/_components/workshop-resource-list'

import { Skeleton } from '@coursebuilder/ui'

const LessonLayout: React.FC<
	React.PropsWithChildren<{
		params: {
			module: string
			lesson: string
		}
	}>
> = async (props) => {
	const params = await props.params

	const { children } = props

	return (
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
				<WorkshopResourceList
					currentLessonSlug={params.lesson}
					className="hidden lg:block"
				/>
			</React.Suspense>

			{children}
		</div>
	)
}

export default LessonLayout
