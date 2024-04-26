export const LESSON_COMPLETED_EVENT = 'progress/lesson.completed'

export type LessonCompleted = {
	name: typeof LESSON_COMPLETED_EVENT
	data: {
		lessonSanityId?: string
		lessonSlug: string
	}
}
