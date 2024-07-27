import React from 'react'
import { getLesson } from '@/lib/lessons-query'
import { getTutorial } from '@/lib/tutorials-query'
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
	const tutorial = await getTutorial(params.module)
	const currentLesson = await getLesson(params.lesson)
	const currentSection =
		currentLesson && (await getResourceSection(currentLesson.id, tutorial))

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
				{tutorial && (
					<TutorialLessonList
						className="hidden lg:block"
						key={tutorial?.id}
						section={currentSection}
						lesson={currentLesson}
						tutorial={tutorial}
					/>
				)}
			</React.Suspense>

			{children}
		</div>
	)
}

export default LessonLayout
