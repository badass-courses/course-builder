import React from 'react'
import { courseBuilderAdapter } from '@/db'
import { getLesson } from '@/lib/lessons-query'
import { getModuleProgressForUser } from '@/lib/progress'
import { getWorkshop } from '@/lib/workshops-query'
import { getResourceSection } from '@/utils/get-resource-section'

import { Skeleton } from '@coursebuilder/ui'

import { TutorialLessonList } from '../../../_components/tutorial-lesson-list'

const LessonLayout: React.FC<
	React.PropsWithChildren<{
		params: {
			module: string
			lesson: string
		}
	}>
> = async ({ children, params }) => {
	const workshop = await getWorkshop(params.module)
	const currentLesson = await getLesson(params.lesson)
	const currentSection =
		currentLesson && (await getResourceSection(currentLesson.id, workshop))
	const moduleProgress = await getModuleProgressForUser(params.module)

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
				{workshop && (
					<TutorialLessonList
						className="hidden lg:block"
						key={workshop?.id}
						section={currentSection}
						moduleProgress={moduleProgress}
						lesson={currentLesson}
						tutorial={workshop}
					/>
				)}
			</React.Suspense>

			{children}
		</div>
	)
}

export default LessonLayout
