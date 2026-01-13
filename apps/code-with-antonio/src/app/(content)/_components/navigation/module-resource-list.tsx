'use client'

import * as React from 'react'
import { createAppAbility } from '@/ability'
import { useModuleProgress } from '@/app/(content)/_components/module-progress-provider'
import { useContentNavigation } from '@/app/(content)/_components/navigation/provider'
import { CldImage } from '@/components/cld-image'
import { useScrollToActive } from '@/hooks/use-scroll-to-active'
import { findSectionIdForResourceSlug } from '@/lib/content-navigation'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { PanelLeftOpen } from 'lucide-react'

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@coursebuilder/ui'

import { getParentContext } from './module-resource-helpers'
import { ModuleResourceListContent } from './module-resource-list-content'
import { ModuleResourceListHeader } from './module-resource-list-header'
import type { ModuleResourceListOptions } from './module-resource-list.types'

type ModuleResourceListProps = {
	currentLessonSlug?: string
	currentSectionSlug?: string | null
	className?: string
	wrapperClassName?: string
	options?: ModuleResourceListOptions
}

/**
 * Renders the module navigation sidebar, wiring ability checks, progress data,
 * and scroll-to-active behavior for the current module context.
 */
export default function ModuleResourceList({
	currentLessonSlug,
	className,
	wrapperClassName,
	options,
}: ModuleResourceListProps) {
	const { isCollapsible = true, withHeader = true } = options || {}

	const moduleNavigation = useContentNavigation()
	const { moduleProgress } = useModuleProgress()

	const { data: abilityRules, status: abilityStatus } =
		api.ability.getCurrentAbilityRules.useQuery(
			{
				resourceId: currentLessonSlug,
				moduleId: moduleNavigation?.id,
			},
			{
				enabled: !!moduleNavigation?.id,
			},
		)

	const ability = React.useMemo(
		() => createAppAbility(abilityRules || []),
		[abilityRules],
	)

	const sectionId = React.useMemo(
		() => findSectionIdForResourceSlug(moduleNavigation, currentLessonSlug),
		[moduleNavigation, currentLessonSlug],
	)

	const scrollAreaRef = useScrollToActive(currentLessonSlug)

	const [headerHeight, setHeaderHeight] = React.useState(0)

	const parentContext = React.useMemo(
		() => getParentContext(moduleNavigation),
		[moduleNavigation],
	)

	// Extract values before early return to maintain hook order
	const resources = moduleNavigation?.resources
	const setIsSidebarCollapsed = moduleNavigation?.setIsSidebarCollapsed
	const isSidebarCollapsed = moduleNavigation?.isSidebarCollapsed ?? false

	const handleNavClick = React.useCallback(() => {
		if (isCollapsible && isSidebarCollapsed && setIsSidebarCollapsed) {
			setIsSidebarCollapsed(!isSidebarCollapsed)
		}
	}, [isCollapsible, isSidebarCollapsed, setIsSidebarCollapsed])

	const getScrollAreaHeight = React.useCallback((headerHeight: number) => {
		return `calc(100vh - ${Math.round(headerHeight)}px)`
	}, [])

	const mergedOptions = React.useMemo(
		() => ({
			...options,
			getScrollAreaHeight: options?.getScrollAreaHeight ?? getScrollAreaHeight,
		}),
		[options, getScrollAreaHeight],
	)

	if (!moduleNavigation) {
		return null
	}

	return (
		<nav
			onClick={handleNavClick}
			aria-expanded={!isSidebarCollapsed}
			aria-controls="workshop-navigation"
			aria-label="Module navigation"
			className={cn('relative w-full shrink-0 overflow-hidden', className, {
				'hover:bg-sidebar-accent w-8 cursor-pointer transition [&_div]:hidden':
					isSidebarCollapsed && isCollapsible,
			})}
		>
			{isSidebarCollapsed && isCollapsible && (
				<TooltipProvider>
					<span className="sticky top-0 flex items-center justify-center border-b p-2">
						<Tooltip key={`${isSidebarCollapsed}-${isCollapsible}`}>
							<TooltipTrigger asChild>
								<PanelLeftOpen className="size-4" />
							</TooltipTrigger>
							<TooltipContent side="left">Open navigation</TooltipContent>
						</Tooltip>
					</span>
				</TooltipProvider>
			)}
			<div className="flex flex-col">
				{options?.withImage && moduleNavigation.fields?.coverImage?.url && (
					<div className="relative aspect-video w-full">
						<CldImage
							src={moduleNavigation.fields?.coverImage?.url}
							alt={moduleNavigation.fields?.title || ''}
							fill
						/>
					</div>
				)}
				{withHeader && (
					<ModuleResourceListHeader
						className="bg-card border-b p-5"
						moduleNavigation={moduleNavigation}
						parentContext={parentContext}
						isCollapsible={isCollapsible}
						isSidebarCollapsed={isSidebarCollapsed}
						setIsSidebarCollapsed={setIsSidebarCollapsed}
						onHeightChange={setHeaderHeight}
					/>
				)}
				<ModuleResourceListContent
					options={mergedOptions}
					resources={resources ?? []}
					sectionId={sectionId}
					currentLessonSlug={currentLessonSlug}
					moduleProgress={moduleProgress}
					ability={ability}
					abilityStatus={abilityStatus}
					wrapperClassName={wrapperClassName}
					scrollAreaRef={scrollAreaRef}
					headerHeight={headerHeight}
					moduleId={moduleNavigation.id}
					moduleNavigation={moduleNavigation}
				/>
			</div>
		</nav>
	)
}
