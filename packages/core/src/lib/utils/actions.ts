import { CourseBuilderAction } from '../../types'

const actions: CourseBuilderAction[] = [
	'webhook',
	'srt',
	'session',
	'subscribe-to-list',
	'checkout',
	'redeem',
	'prices-formatted',
]

export function isCourseBuilderAction(
	action: string,
): action is CourseBuilderAction {
	console.log('isCourseBuilderAction', { action })
	return actions.includes(action as CourseBuilderAction)
}
