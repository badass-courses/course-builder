'use client'

import * as React from 'react'
import type { AppAbility } from '@/ability'
import type {
	Level1ResourceWrapper,
	Level2ResourceWrapper,
	ResourceNavigation,
} from '@/lib/content-navigation'
import { cn } from '@/utils/cn'

import type { ModuleProgress } from '@coursebuilder/core/schemas'
import { Accordion, ScrollArea, ScrollBar } from '@coursebuilder/ui'

import { MODULE_RESOURCE_LIST_DATA_ATTRS } from './module-resource-helpers'
import { ModuleResourceListLesson } from './module-resource-list-lesson'
import { ModuleResourceListSection } from './module-resource-list-section'
import type { ModuleResourceListOptions } from './module-resource-list.types'

type ModuleResourceListContentProps = {
	resources: Level1ResourceWrapper[]
	sectionId: string | null
	currentLessonSlug?: string
	moduleProgress?: ModuleProgress | null
	ability: AppAbility
	abilityStatus: 'error' | 'success' | 'pending'
	wrapperClassName?: string
	scrollAreaRef: React.RefObject<HTMLDivElement | null>
	headerHeight: number
	moduleId: string
	moduleNavigation: ResourceNavigation
	options?: ModuleResourceListOptions
}

export function ModuleResourceListContent({
	resources,
	sectionId,
	currentLessonSlug,
	moduleProgress,
	ability,
	abilityStatus,
	wrapperClassName,
	scrollAreaRef,
	headerHeight,
	moduleId,
	moduleNavigation,
	options,
}: ModuleResourceListContentProps) {
	const stretchToFullViewportHeight =
		options?.stretchToFullViewportHeight ?? true

	const getScrollAreaHeight =
		options?.getScrollAreaHeight ??
		((headerHeight: number) =>
			`calc(100vh - ${Math.round(headerHeight)}px - var(--nav-height))`)

	const filteredResources = React.useMemo(
		() => resources.filter((r) => r?.resource),
		[resources],
	)

	const defaultAccordionValue = React.useMemo(() => {
		return sectionId || filteredResources[0]?.resource?.id || undefined
	}, [sectionId, filteredResources])

	return (
		<ScrollArea
			className={cn('')}
			style={{
				height: stretchToFullViewportHeight
					? getScrollAreaHeight(headerHeight)
					: 'auto',
			}}
			ref={scrollAreaRef}
			scrollHideDelay={0}
			data-module-resource-list={MODULE_RESOURCE_LIST_DATA_ATTRS.content}
		>
			<Accordion
				type="single"
				collapsible
				className={cn('flex flex-col', wrapperClassName)}
				defaultValue={defaultAccordionValue}
			>
				<ol className="divide-border divide-y">
					{filteredResources.map(({ resource, metadata }, i: number) => {
						const childResources =
							resource.resources
								?.map((wrapper) => wrapper.resource)
								.filter(
									(r): r is Level2ResourceWrapper['resource'] =>
										r !== undefined,
								) || []

						const isCollapsibleResource =
							['section', 'workshop'].includes(resource.type) &&
							childResources.length > 0

						return isCollapsibleResource ? (
							<ModuleResourceListSection
								index={i}
								key={`${resource.id}-accordion`}
								resource={resource}
								metadata={metadata}
								childResources={childResources}
								currentLessonSlug={currentLessonSlug}
								moduleProgress={moduleProgress}
								ability={ability}
								abilityStatus={abilityStatus}
								moduleId={moduleId}
								moduleNavigation={moduleNavigation}
								options={options}
							/>
						) : (
							<ModuleResourceListLesson
								key={resource.id}
								className={cn('')}
								lesson={resource}
								index={i}
								moduleProgress={moduleProgress}
								moduleId={moduleId}
								ability={ability}
								abilityStatus={abilityStatus}
							/>
						)
					})}
				</ol>
			</Accordion>
			{/* <ScrollBar orientation="vertical" /> */}
		</ScrollArea>
	)
}
