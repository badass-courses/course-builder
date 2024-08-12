'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { revalidateTutorialLesson } from '@/app/(content)/tutorials/actions'
import type { Lesson } from '@/lib/lessons'
import { setProgressForResource } from '@/lib/progress'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'

import { Label, Switch } from '@coursebuilder/ui'

export function TutorialLessonProgressToggle({
	lesson,
	moduleType = 'tutorial',
}: {
	lesson: Lesson
	moduleType?: string
}) {
	const params = useParams()
	const [] = React.useState(false)

	const utils = api.useUtils()

	const { data: moduleProgress, refetch } =
		api.progress.getModuleProgressForUser.useQuery({
			moduleId: params.module as string,
		})

	const [isCompleted, setIsCompleted] = React.useOptimistic(
		Boolean(
			moduleProgress?.completedLessons?.some(
				(p) => p.resourceId === lesson?.id && p.completedAt,
			),
		),
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
				aria-label={`Mark lesson as ${isCompleted ? 'incomplete' : 'completed'}`}
				id="lesson-progress-toggle"
				checked={isCompleted}
				onCheckedChange={async (checked) => {
					startTransition(() => {
						console.log('startTransition')
						setIsCompleted(checked)
					})
					const lessonProgress = await setProgressForResource({
						resourceId: lesson.id,
						isCompleted: checked,
					})

					await utils.progress.invalidate()

					// await revalidateTutorialLesson(
					// 	params.module as string,
					// 	params.lesson as string,
					// 	moduleType,
					// )
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
