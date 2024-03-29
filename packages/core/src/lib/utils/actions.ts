import { CourseBuilderAction } from '../../types'

const actions: CourseBuilderAction[] = [
	'webhook',
	'srt',
	'session',
	'subscribe-to-list',
]

export function isCourseBuilderAction(
	action: string,
): action is CourseBuilderAction {
	return actions.includes(action as CourseBuilderAction)
}
