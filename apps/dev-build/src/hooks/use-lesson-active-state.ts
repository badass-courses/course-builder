import { useMemo } from 'react'
import { useParams, usePathname } from 'next/navigation'

/**
 * Hook to determine active lesson state from URL params and pathname.
 * Handles both [lesson] routes (workshops) and [post] routes.
 * Returns active state flags and aria-current helper.
 */
export function useLessonActiveState(lessonSlug: string) {
	const params = useParams()
	const pathname = usePathname()

	// Support both [lesson] param (workshops) and [post] param (posts/lists)
	const currentSlug = params.lesson ?? params.post
	const isOnSolution = pathname.includes('/solution')
	const isActiveLesson = lessonSlug === currentSlug && !isOnSolution
	const isActiveSolution =
		lessonSlug === currentSlug && pathname.includes('/solution')

	const ariaCurrent = useMemo(() => {
		if (isActiveLesson || isActiveSolution) {
			return 'page' as const
		}
		return undefined
	}, [isActiveLesson, isActiveSolution])

	return {
		isActiveLesson,
		isActiveSolution,
		isOnSolution,
		ariaCurrent,
	}
}
