import { CourseBuilderAction } from '../../types'

const actions: CourseBuilderAction[] = [
	'webhook',
	'srt',
	'session',
	'subscribe-to-list',
	'checkout',
	'redeem',
]

export function isCourseBuilderAction(
	action: string,
): action is CourseBuilderAction {
	return actions.includes(action as CourseBuilderAction)
}
