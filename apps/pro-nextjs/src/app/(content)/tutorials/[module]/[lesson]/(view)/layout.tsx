import React from 'react'
import { ModuleProgressProvider } from '@/app/(content)/_components/module-progress-provider'
import { getLesson } from '@/lib/lessons-query'
import { getModuleProgressForUser } from '@/lib/progress'
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
	const moduleProgressLoader = getModuleProgressForUser(params.module)

	return (
		<ModuleProgressProvider moduleProgressLoader={moduleProgressLoader}>
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
		</ModuleProgressProvider>
	)
}

export default LessonLayout
