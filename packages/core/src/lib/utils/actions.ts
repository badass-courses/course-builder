import { CourseBuilderAction } from '../../types'

const actions: CourseBuilderAction[] = ['webhook', 'srt', 'session']

export function isCourseBuilderAction(
	action: string,
): action is CourseBuilderAction {
	return actions.includes(action as CourseBuilderAction)
}
