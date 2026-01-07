'use client'

import * as React from 'react'

import {
	ModuleProgress,
	moduleProgressSchema,
} from '@coursebuilder/core/schemas'

type ModuleProgressContextType = {
	moduleProgress: ModuleProgress | null
	removeLessonProgress: (lessonId: string) => void
	addLessonProgress: (lessonId: string) => void
}

const ModuleProgressContext = React.createContext<ModuleProgressContextType>({
	moduleProgress: null,
	removeLessonProgress: () => {},
	addLessonProgress: () => {},
})

type ProgressAction =
	| { type: 'REMOVE_LESSON_PROGRESS'; payload: { lessonId: string } }
	| { type: 'ADD_LESSON_PROGRESS'; payload: { lessonId: string } }

function progressReducer(
	progress: ModuleProgress | null,
	action: ProgressAction,
) {
	const currentProgress =
		progress ||
		moduleProgressSchema.parse({
			completedLessons: [],
			nextResource: null,
			percentCompleted: 0,
			completedLessonsCount: 0,
			totalLessonsCount: 0,
		})

	const { lessonId } = action.payload

	let newProgress = currentProgress

	switch (action.type) {
		case 'ADD_LESSON_PROGRESS':
			newProgress = {
				...currentProgress,
				completedLessons: [
					...currentProgress.completedLessons,
					{
						resourceId: lessonId,
						completedAt: new Date(),
						userId: '',
					},
				],
				completedLessonsCount: currentProgress.completedLessonsCount + 1,
			}
			break
		case 'REMOVE_LESSON_PROGRESS':
			newProgress = {
				...currentProgress,
				completedLessons: currentProgress.completedLessons.filter(
					(completedLesson) => completedLesson.resourceId !== lessonId,
				),
				completedLessonsCount: currentProgress.completedLessonsCount - 1,
			}
			break
	}

	return newProgress
}

export const ModuleProgressProvider = ({
	children,
	moduleProgressLoader,
}: {
	children: React.ReactNode
	moduleProgressLoader: Promise<ModuleProgress | null>
}) => {
	const initialProgress = React.use(moduleProgressLoader)

	const [optimisticProgress, updateOptimisticProgress] = React.useOptimistic(
		initialProgress,
		progressReducer,
	)

	const removeLessonProgress = (lessonId: string) => {
		updateOptimisticProgress({
			type: 'REMOVE_LESSON_PROGRESS',
			payload: { lessonId },
		})
	}

	const addLessonProgress = (lessonId: string) => {
		updateOptimisticProgress({
			type: 'ADD_LESSON_PROGRESS',
			payload: { lessonId },
		})
	}

	const value = React.useMemo(
		() => ({
			moduleProgress: optimisticProgress,
			removeLessonProgress,
			addLessonProgress,
		}),
		[optimisticProgress],
	)
	return (
		<ModuleProgressContext.Provider value={value}>
			{children}
		</ModuleProgressContext.Provider>
	)
}

export const useModuleProgress = () => {
	const context = React.use(ModuleProgressContext)
	if (!context) {
		throw new Error(
			'useModuleProgress must be used within a ModuleProgressProvider',
		)
	}
	return context
}
