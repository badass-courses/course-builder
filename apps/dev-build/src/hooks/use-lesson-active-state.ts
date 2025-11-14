import { useMemo } from 'react'
import { useParams, usePathname } from 'next/navigation'

/**
 * Hook to determine active lesson state from URL params and pathname
 * Returns active state flags and aria-current helper
 */
export function useLessonActiveState(lessonSlug: string) {
	const params = useParams()
	const pathname = usePathname()

	const isOnSolution = pathname.includes('/solution')
	const isActiveLesson = lessonSlug === params.lesson && !isOnSolution
	const isActiveSolution =
		lessonSlug === params.lesson && pathname.includes('/solution')

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
