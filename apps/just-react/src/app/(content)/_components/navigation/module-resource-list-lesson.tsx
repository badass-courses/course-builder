'use client'

import * as React from 'react'
import { useMemo } from 'react'
import Link from 'next/link'
import { useLessonActiveState } from '@/hooks/use-lesson-active-state'
import { cn } from '@/utils/cn'
import { subject } from '@casl/ability'
import { Check, Lock, Pen } from 'lucide-react'

import type { ContentResource } from '@coursebuilder/core/schemas'
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@coursebuilder/ui'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

import {
	getParentResourceData,
	isLessonCompleted,
	MODULE_RESOURCE_LIST_DATA_ATTRS,
} from './module-resource-helpers'
import { ModuleResourceListSolutionMenu } from './module-resource-list-solution-menu'
import type { LessonResourceProps } from './module-resource-list.types'
import { useContentNavigation } from './provider'

/**
 * Renders a lesson row within the module resource navigation list, including
 * progress state, ability gating, and optional solution links.
 */
export const ModuleResourceListLesson = React.memo(
	function ModuleResourceListLesson({
		lesson,
		moduleProgress,
		index,
		ability,
		abilityStatus,
		className,
		moduleId,
		parentIndex,
		parentResource,
	}: LessonResourceProps) {
		const resourceNavigation = useContentNavigation()
		const lessonSlug = lesson.fields?.slug ?? ''

		const { isActiveLesson, isActiveSolution, isOnSolution, ariaCurrent } =
			useLessonActiveState(lessonSlug)

		const childResources = React.useMemo(() => {
			return (
				lesson.resources
					?.map((wrapper) => wrapper.resource)
					.filter(
						(resource): resource is ContentResource => resource !== undefined,
					) || []
			)
		}, [lesson])

		const solution = React.useMemo(
			() =>
				lesson.type === 'lesson'
					? childResources.find((resource) => resource.type === 'solution')
					: undefined,
			[lesson.type, childResources],
		)

		const isActiveGroup =
			(isActiveLesson &&
				lesson.type === 'lesson' &&
				childResources.length > 0) ||
			isActiveSolution

		const isCompleted = React.useMemo(
			() => isLessonCompleted(lesson.id, moduleProgress),
			[lesson.id, moduleProgress],
		)

		const { canView, canCreate } = useMemo(
			() => ({
				canView: ability.can('read', subject('Content', { id: lesson.id })),
				canCreate: ability.can('create', 'Content'),
			}),
			[lesson.id, ability],
		)

		const parentData = useMemo(
			() => getParentResourceData(parentResource, resourceNavigation ?? null),
			[parentResource, resourceNavigation],
		)

		const { viewPath, editPath } = useMemo(
			() => ({
				viewPath: (slug?: string) =>
					getResourcePath(
						lesson.type,
						slug || lesson.fields?.slug || '',
						'view',
						parentData,
					),
				editPath: (slug?: string) =>
					getResourcePath(
						lesson.type,
						slug || lesson.fields?.slug || '',
						'edit',
						parentData,
					),
			}),
			[lesson.type, lesson.fields?.slug, parentData],
		)

		const baseStyles = cn(
			'relative flex w-full text-sm items-center leading-tight py-2 min-h-16 pl-3 pr-10 font-medium before:content-[""] before:w-[2px] before:absolute before:left-0 before:top-0 before:h-full',
			className,
			{
				'bg-card text-primary before:bg-primary':
					isActiveLesson || isActiveSolution,
				'hover:bg-muted hover:text-primary':
					canView && !isActiveLesson && !isActiveGroup,
				'text-foreground': canView && isActiveGroup,
			},
		)

		const rowContent = (
			<>
				{isCompleted ? (
					<div
						aria-label="Completed"
						className="flex w-6 shrink-0 items-center justify-center pr-1"
					>
						<Check aria-hidden="true" className="relative h-4 w-4" />
					</div>
				) : (
					<span
						className="relative w-6 shrink-0 pr-1 text-center text-[10px] text-gray-400"
						aria-hidden="true"
					>
						{parentIndex !== undefined
							? `${parentIndex + 1}.${index + 1}`
							: index + 1}
					</span>
				)}
				<span className="line-clamp-2 w-full">{lesson.fields?.title}</span>
				{abilityStatus === 'success' && !canView && (
					<Lock
						className="absolute right-5 w-3 text-gray-500"
						aria-label="locked"
					/>
				)}
			</>
		)

		return (
			<li
				className={cn(
					'relative before:absolute before:left-0 before:top-0 before:h-full before:w-[2px] before:bg-transparent before:content-[""]',
					{
						'bg-card before:bg-primary': isActiveGroup,
					},
				)}
				data-active={isActiveLesson ? 'true' : 'false'}
				data-module-resource-list={MODULE_RESOURCE_LIST_DATA_ATTRS.lesson}
			>
				<div>
					<div className="relative flex w-full items-center">
						{canView ? (
							<Link
								className={cn('', baseStyles)}
								href={viewPath()}
								prefetch
								aria-current={ariaCurrent}
							>
								{rowContent}
							</Link>
						) : (
							<div className={baseStyles}>{rowContent}</div>
						)}
						{canCreate && (
							<TooltipProvider>
								<Tooltip delayDuration={0}>
									<TooltipTrigger asChild>
										<Button
											asChild
											variant="outline"
											size="icon"
											className="scale-60 absolute right-0.5"
										>
											<Link href={editPath()}>
												<Pen className="w-3" />
											</Link>
										</Button>
									</TooltipTrigger>
									<TooltipContent side="right">
										<span className="text-xs">Edit</span>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}
					</div>
				</div>
				{solution && isActiveGroup && (
					<ModuleResourceListSolutionMenu
						lesson={lesson}
						isActiveLesson={isActiveLesson}
						isActiveSolution={isActiveSolution}
						resourceNavigation={resourceNavigation}
					/>
				)}
			</li>
		)
	},
)
