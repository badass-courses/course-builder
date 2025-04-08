'use client'

import { setProgressForResource } from '@/lib/progress'
import { cn } from '@/utils/cn'

import { Switch } from '@coursebuilder/ui'

import { useProgress } from './progress-provider'

export default function PostProgressToggle({
	postId,
	className,
}: {
	postId: string
	className?: string
}) {
	const { addLessonProgress, removeLessonProgress, progress } = useProgress()
	const isCompleted = progress?.completedLessons.some(
		(lesson) => lesson.resourceId === postId,
	)
	return (
		<div className={cn('flex items-center gap-3', className)}>
			<Switch
				checked={isCompleted}
				id="progress"
				onCheckedChange={async (checked) => {
					checked ? addLessonProgress(postId) : removeLessonProgress(postId)
					await setProgressForResource({
						resourceId: postId,
						isCompleted: checked ? true : false,
					})
				}}
			/>
			<label htmlFor="progress" className="text-primary">
				{isCompleted ? 'Completed' : 'Complete'}
			</label>
		</div>
	)
}
