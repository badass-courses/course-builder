'use client'

import Link from 'next/link'
import { cn } from '@/utils/cn'

import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

import { MODULE_RESOURCE_LIST_DATA_ATTRS } from './module-resource-helpers'
import type { SolutionMenuProps } from './module-resource-list.types'

/**
 * Navigation menu for problem/solution resources
 * Renders links to both the problem and solution views of a lesson
 */
export function ModuleResourceListSolutionMenu({
	lesson,
	isActiveLesson,
	isActiveSolution,
	resourceNavigation,
}: SolutionMenuProps) {
	const parentData = resourceNavigation
		? {
				parentSlug: resourceNavigation.fields?.slug,
				parentType: resourceNavigation.type,
			}
		: undefined

	return (
		<ul
			className="flex flex-col gap-0.5 px-6 pb-2"
			data-module-resource-list={MODULE_RESOURCE_LIST_DATA_ATTRS.solutionMenu}
		>
			<li data-active={isActiveLesson ? 'true' : 'false'}>
				<Link
					className={cn(
						'relative flex w-full items-center rounded-md px-3 py-1 text-sm font-medium',
						{
							'bg-muted text-primary': isActiveLesson,
							'hover:text-primary hover:bg-muted': !isActiveLesson,
						},
					)}
					prefetch={true}
					href={getResourcePath(
						lesson.type,
						lesson.fields?.slug,
						'view',
						parentData,
					)}
					aria-current={isActiveLesson ? 'page' : undefined}
				>
					Problem
				</Link>
			</li>
			<li data-active={isActiveSolution ? 'true' : 'false'}>
				<Link
					className={cn(
						'relative flex w-full items-center rounded-md px-3 py-1 text-sm font-medium',
						{
							'bg-muted text-primary': isActiveSolution,
							'hover:text-primary hover:bg-muted': !isActiveSolution,
						},
					)}
					prefetch={true}
					href={getResourcePath(
						'solution',
						lesson.fields?.slug,
						'view',
						parentData,
					)}
					aria-current={isActiveSolution ? 'page' : undefined}
				>
					Solution
				</Link>
			</li>
		</ul>
	)
}
