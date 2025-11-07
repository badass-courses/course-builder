'use client'

import * as React from 'react'
import { cn } from '@/utils/cn'
import { formatCohortDateRange } from '@/utils/format-cohort-date'
import { subject } from '@casl/ability'
import { Check, Lock, Play } from 'lucide-react'

import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@coursebuilder/ui'

import { MODULE_RESOURCE_LIST_DATA_ATTRS } from './module-resource-helpers'
import { ModuleResourceListLesson } from './module-resource-list-lesson'
import type { SectionItemProps } from './module-resource-list.types'

export function ModuleResourceListSection({
	resource,
	metadata,
	childResources,
	currentLessonSlug,
	moduleProgress,
	ability,
	abilityStatus,
	moduleId,
	moduleNavigation,
	index: sectionIndex,
	options,
}: SectionItemProps) {
	const { showLessonCount = false } = options || {}

	const isActiveGroup =
		(resource.type === 'section' || resource.type === 'lesson') &&
		childResources.some((item) => currentLessonSlug === item.fields?.slug)

	const sectionCompleted = React.useMemo(() => {
		if (resource.type !== 'section') return false
		return childResources.every((item) =>
			moduleProgress?.completedLessons?.some(
				(progress) => progress.resourceId === item.id && progress.completedAt,
			),
		)
	}, [resource.type, childResources, moduleProgress])

	const firstLesson =
		resource.type === 'section' ? childResources[0] : undefined
	const firstLessonId = firstLesson?.id

	const canViewWorkshop =
		firstLessonId &&
		ability.can('read', subject('Content', { id: moduleNavigation.id }))

	const { dateString: resourceDateString, timeString: resourceTimeString } =
		formatCohortDateRange(
			resource.fields?.startsAt,
			null,
			resource.fields?.timezone || 'America/Los_Angeles',
		)

	return (
		<li key={`${resource.id}-accordion`}>
			<AccordionItem
				value={resource.id}
				className="border-0"
				data-module-resource-list={MODULE_RESOURCE_LIST_DATA_ATTRS.section}
			>
				<AccordionTrigger
					className={cn(
						'hover:bg-muted group relative flex min-h-12 w-full cursor-pointer items-center gap-2 rounded-none px-3 py-3 text-left text-sm font-medium leading-tight hover:no-underline [&>svg]:-rotate-90 [&[data-state=open]>svg]:rotate-0',
						{
							'': isActiveGroup,
						},
					)}
				>
					<div className="flex w-full items-center justify-between">
						<div className="flex w-full items-center">
							{sectionCompleted ? (
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
									{sectionIndex + 1}
								</span>
							)}
							<div className="fle flex-col gap-1">
								<span className="group-hover:text-primary line-clamp-2 w-full">
									{resource.fields?.title}
								</span>
								{resource.type === 'workshop' &&
									resourceDateString &&
									!canViewWorkshop && (
										<div className="flex items-center gap-1 text-xs opacity-75">
											<Lock
												className="text-muted-foreground w-3"
												aria-label="Locked content"
											/>
											Available from {resourceDateString} {resourceTimeString}
										</div>
									)}
							</div>
						</div>
						{childResources.length > 0 && showLessonCount && (
							<span className="text-xs font-normal opacity-50">
								({childResources.length})
							</span>
						)}
					</div>
					<div className="flex items-center">
						{abilityStatus === 'success' && (
							<>
								{metadata?.tier === 'free' && !canViewWorkshop ? (
									<div
										className="text-muted-foreground inline-flex shrink-0 items-center gap-0.5 rounded border px-1.5 py-1 text-xs font-medium leading-none"
										aria-label="Free content"
									>
										<Play className="size-3" /> Free
									</div>
								) : !canViewWorkshop && resource.type !== 'workshop' ? (
									<Lock
										className="text-muted-foreground w-3"
										aria-label="Locked content"
									/>
								) : null}
							</>
						)}
					</div>
				</AccordionTrigger>

				{childResources.length > 0 && (
					<AccordionContent className="pb-0">
						<ol className="">
							{childResources.map((item, index: number) => {
								return (
									<ModuleResourceListLesson
										className="before:bg-border pl-8 before:left-5"
										parentResource={
											resource.type === 'workshop' ? resource : undefined
										}
										lesson={item}
										moduleId={moduleId}
										parentIndex={sectionIndex}
										index={index}
										moduleProgress={moduleProgress}
										ability={ability}
										abilityStatus={abilityStatus}
										key={item.id}
									/>
								)
							})}
						</ol>
					</AccordionContent>
				)}
			</AccordionItem>
		</li>
	)
}
