import { CourseBuilderAction } from '../../types'

const actions: CourseBuilderAction[] = [
	'webhook',
	'srt',
	'session',
	'subscribe-to-list',
	'checkout',
]

export function isCourseBuilderAction(
	action: string,
): action is CourseBuilderAction {
	console.log({ action })
	return actions.includes(action as CourseBuilderAction)
}
