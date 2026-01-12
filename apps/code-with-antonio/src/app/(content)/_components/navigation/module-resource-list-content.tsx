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
import { Accordion, ScrollArea } from '@coursebuilder/ui'

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
/**
 * Wraps module resources in a scrollable accordion, wiring progress,
 * ability, and layout options for sections and lessons.
 */
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
		((headerHeight: number) => `calc(100vh - ${Math.round(headerHeight)}px)`)

	const filteredResources = React.useMemo(
		() => resources.filter((r) => r?.resource),
		[resources],
	)

	const defaultAccordionValue = React.useMemo(() => {
		return sectionId || filteredResources[0]?.resource?.id || undefined
	}, [sectionId, filteredResources])

	const showFade = useScrollFade(scrollAreaRef)

	return (
		<div className="relative">
			<ScrollArea
				className={cn('')}
				style={{
					height:
						options?.listHeight !== undefined
							? options.listHeight
							: stretchToFullViewportHeight
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
			</ScrollArea>
			{/* Fade overlay shown when content is scrollable and not at bottom */}
			<div
				aria-hidden="true"
				className={cn(
					'from-card pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t to-transparent transition-opacity duration-200',
					showFade ? 'opacity-100' : 'opacity-0',
				)}
			/>
		</div>
	)
}

/**
 * Hook to detect if a scroll container is scrollable and whether
 * the user has scrolled near the bottom.
 */
function useScrollFade(scrollAreaRef: React.RefObject<HTMLDivElement | null>) {
	const [showFade, setShowFade] = React.useState(false)

	React.useEffect(() => {
		const scrollArea = scrollAreaRef.current
		if (!scrollArea) return

		const viewport = scrollArea.querySelector(
			'[data-radix-scroll-area-viewport]',
		)
		if (!viewport) return

		const checkScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = viewport
			const isScrollable = scrollHeight > clientHeight
			const isNearBottom = scrollTop + clientHeight >= scrollHeight - 20
			setShowFade(isScrollable && !isNearBottom)
		}

		checkScroll()
		viewport.addEventListener('scroll', checkScroll)
		const resizeObserver = new ResizeObserver(checkScroll)
		resizeObserver.observe(viewport)

		return () => {
			viewport.removeEventListener('scroll', checkScroll)
			resizeObserver.disconnect()
		}
	}, [scrollAreaRef])

	return showFade
}
