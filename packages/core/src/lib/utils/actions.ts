import { CourseBuilderAction } from '../../types'

const actions: CourseBuilderAction[] = [
	'webhook',
	'srt',
	'session',
	'subscribe-to-list',
	'checkout',
	'redeem',
	'prices-formatted',
	'subscriber',
]

export function isCourseBuilderAction(
	action: string,
): action is CourseBuilderAction {
	return actions.includes(action as CourseBuilderAction)
}
