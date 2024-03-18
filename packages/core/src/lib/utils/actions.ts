import { CourseBuilderAction } from '../../types'

const actions: CourseBuilderAction[] = ['webhook']

export function isCourseBuilderAction(action: string): action is CourseBuilderAction {
  console.log(actions, action)
  return actions.includes(action as CourseBuilderAction)
}
