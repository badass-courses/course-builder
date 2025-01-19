'use client'

import { setProgressForResource } from '@/lib/progress'

import { Switch } from '@coursebuilder/ui'

import { useProgress } from './progress-provider'

export default function PostProgressToggle({ postId }: { postId: string }) {
	const { addLessonProgress, removeLessonProgress, progress } = useProgress()
	const isCompleted = progress?.completedLessons.some(
		(lesson) => lesson.resourceId === postId,
	)
	return (
		<Switch
			checked={isCompleted}
			onCheckedChange={async (checked) => {
				checked ? addLessonProgress(postId) : removeLessonProgress(postId)
				await setProgressForResource({
					resourceId: postId,
					isCompleted: checked ? true : false,
				})
			}}
		/>
	)
}
