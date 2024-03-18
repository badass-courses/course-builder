import { CourseBuilderAction } from '../../types'

const actions: CourseBuilderAction[] = ['webhook']

export function isCourseBuilderAction(action: string): action is CourseBuilderAction {
  return actions.includes(action as CourseBuilderAction)
}
