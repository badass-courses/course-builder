'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { useModuleProgress } from '@/app/(content)/_components/module-progress-provider'
import type { Lesson } from '@/lib/lessons'
import { setProgressForResource } from '@/lib/progress'

import { Label, Switch } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'
import type { AbilityForResource } from '@coursebuilder/utils-auth/current-ability-rules'

import { revalidateModuleLesson } from '../actions'

export function ModuleLessonProgressToggle({
	lesson,
	moduleType = 'tutorial',
	lessonType,
	abilityLoader,
}: {
	lesson: Lesson
	moduleType?: string
	lessonType?: 'lesson' | 'exercise' | 'solution'
	abilityLoader: Promise<
		Omit<AbilityForResource, 'canView'> & {
			canViewWorkshop: boolean
			canViewLesson: boolean
			isPendingOpenAccess: boolean
		}
	>
}) {
	const params = useParams()
	const ability = React.use(abilityLoader)
	const canView = ability?.canViewLesson

	const { moduleProgress, addLessonProgress, removeLessonProgress } =
		useModuleProgress()

	const isCompleted = Boolean(
		moduleProgress?.completedLessons?.some(
			(p) => p.resourceId === lesson?.id && p.completedAt,
		),
	)

	const [isPending, startTransition] = React.useTransition()
	const disabled = isPending || !canView
	return lesson ? (
		<>
			<Label
				htmlFor="lesson-progress-toggle"
				className={cn(
					'hover:bg-muted/50 flex h-full items-center gap-0.5 border-l pl-2 transition hover:cursor-pointer',
				)}
			>
				<Switch
					disabled={disabled}
					className="scale-75 disabled:cursor-auto"
					aria-label={`Mark lesson as ${isCompleted ? 'incomplete' : 'completed'}`}
					id="lesson-progress-toggle"
					checked={isCompleted}
					onCheckedChange={async (checked) => {
						if (checked) {
							startTransition(() => {
								addLessonProgress(lesson.id)
							})
						} else {
							startTransition(() => {
								removeLessonProgress(lesson.id)
							})
						}
						await setProgressForResource({
							resourceId: lesson.id,
							isCompleted: checked,
						})
						await revalidateModuleLesson(
							params.module as string,
							params.lesson as string,
							moduleType,
							lessonType,
						)
					}}
				/>
				<div className="w-[9ch]">{isCompleted ? 'Completed' : 'Complete'}</div>
			</Label>
		</>
	) : null
}

export function ModuleLessonProgressToggleSkeleton() {
	return (
		<div className="flex animate-pulse items-center gap-2">
			<Label htmlFor="lesson-progress-toggle" className="font-light">
				Mark as complete
			</Label>
			<Switch disabled aria-label="Loading lesson progress" />
		</div>
	)
}
