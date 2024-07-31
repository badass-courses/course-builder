'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { revalidateTutorialLesson } from '@/app/(content)/tutorials/actions'
import type { Lesson } from '@/lib/lessons'
import { toggleProgress } from '@/lib/progress'
import { cn } from '@/utils/cn'

import type { ModuleProgress } from '@coursebuilder/core/schemas'
import { Label, Switch } from '@coursebuilder/ui'

export function LessonProgressToggle({
	moduleProgressLoader,
	lesson,
}: {
	moduleProgressLoader: Promise<ModuleProgress | null>
	lesson: Lesson
}) {
	const moduleProgress = React.use(moduleProgressLoader)

	const params = useParams()

	const isLessonCompleted = Boolean(
		moduleProgress?.completedLessons?.some(
			(p) => p.resourceId === lesson?.id && p.completedAt,
		),
	)

	const [optimisticState, addOptimistic] = React.useOptimistic(
		isLessonCompleted,
		(currentStatus: boolean, optimisticValue: boolean) => {
			return optimisticValue
		},
	)

	const [isPending, startTransition] = React.useTransition()

	return lesson ? (
		<div className="flex items-center gap-2">
			<Label htmlFor="lesson-progress-toggle" className="font-light">
				Mark as complete
			</Label>
			<Switch
				disabled={isPending}
				className={cn('', {
					'cursor-wait disabled:cursor-wait disabled:opacity-100': isPending,
				})}
				aria-label={`Mark lesson as ${optimisticState ? 'incomplete' : 'completed'}`}
				id="lesson-progress-toggle"
				checked={optimisticState}
				onCheckedChange={async (checked) => {
					startTransition(() => {
						addOptimistic(checked)
					})
					const lessonProgress = await toggleProgress({ resourceId: lesson.id })

					if (lessonProgress) {
						await revalidateTutorialLesson(
							params.module as string,
							params.lesson as string,
						)

						startTransition(() => {
							addOptimistic(Boolean(lessonProgress?.completedAt))
						})
					}
				}}
			/>
		</div>
	) : null
}

export function LessonProgressToggleSkeleton() {
	return (
		<div className="flex animate-pulse items-center gap-2">
			<Label htmlFor="lesson-progress-toggle" className="font-light">
				Mark as complete
			</Label>
			<Switch disabled aria-label="Loading lesson progress" />
		</div>
	)
}
