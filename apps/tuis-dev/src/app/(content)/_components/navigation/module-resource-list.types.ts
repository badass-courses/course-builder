import type { AppAbility } from '@/ability'
import type {
	Level1ResourceWrapper,
	Level2ResourceWrapper,
	ResourceNavigation,
} from '@/lib/content-navigation'

import type { ModuleProgress } from '@coursebuilder/core/schemas'

export type ModuleResourceListOptions = {
	showLessonCount?: boolean
	listHeight?: number
	stretchToFullViewportHeight?: boolean
	withHeader?: boolean
	withImage?: boolean
	isCollapsible?: boolean
	getScrollAreaHeight?: (headerHeight: number) => string
}

export type LessonResourceProps = {
	lesson: Level1ResourceWrapper['resource'] | Level2ResourceWrapper['resource']
	moduleProgress?: ModuleProgress | null
	index: number
	parentIndex?: number
	ability: AppAbility
	abilityStatus: 'error' | 'success' | 'pending'
	className?: string
	moduleId: string
	parentResource?:
		| Level1ResourceWrapper['resource']
		| Level2ResourceWrapper['resource']
}

export type SectionItemProps = {
	options?: ModuleResourceListOptions
	index: number
	resource: Level1ResourceWrapper['resource']
	metadata: Level1ResourceWrapper['metadata']
	childResources: Array<Level2ResourceWrapper['resource']>
	currentLessonSlug?: string
	moduleProgress?: ModuleProgress | null
	ability: AppAbility
	abilityStatus: 'error' | 'success' | 'pending'
	moduleId: string
	moduleNavigation: ResourceNavigation
}

export type SolutionMenuProps = {
	lesson: Level1ResourceWrapper['resource'] | Level2ResourceWrapper['resource']
	isActiveLesson: boolean
	isActiveSolution: boolean
	resourceNavigation: ResourceNavigation | null
}
