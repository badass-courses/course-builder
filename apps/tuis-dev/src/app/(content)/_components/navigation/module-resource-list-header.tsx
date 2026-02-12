'use client'

import * as React from 'react'
import Link from 'next/link'
import type { ResourceNavigation } from '@/lib/content-navigation'
import { cn } from '@/utils/cn'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import pluralize from 'pluralize'

import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@coursebuilder/ui'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

import { AutoPlayToggle } from '../autoplay-toggle'
import { MODULE_RESOURCE_LIST_DATA_ATTRS } from './module-resource-helpers'

type ModuleResourceListHeaderProps = {
	moduleNavigation: ResourceNavigation
	parentContext: { slug: string | null; title: string | null } | null
	isCollapsible: boolean
	isSidebarCollapsed: boolean
	setIsSidebarCollapsed?: (collapsed: boolean) => void
	onHeightChange: (height: number) => void
	className?: string
}

/**
 * Renders the module navigation header with collapse controls and
 * top-level resource links.
 */
export function ModuleResourceListHeader({
	moduleNavigation,
	parentContext,
	isCollapsible,
	isSidebarCollapsed,
	setIsSidebarCollapsed,
	onHeightChange,
	className,
}: ModuleResourceListHeaderProps) {
	const headerRef = React.useRef<HTMLDivElement>(null)

	React.useEffect(() => {
		const measureHeight = () => {
			if (headerRef.current) {
				// offsetHeight includes padding and border
				const height = headerRef.current.offsetHeight
				if (height > 0) {
					onHeightChange(height)
				}
			}
		}

		measureHeight()

		// Re-measure on resize
		const resizeObserver = new ResizeObserver(measureHeight)
		if (headerRef.current) {
			resizeObserver.observe(headerRef.current)
		}

		return () => {
			resizeObserver.disconnect()
		}
	}, [onHeightChange])

	const handleToggle = React.useCallback(() => {
		setIsSidebarCollapsed?.(!isSidebarCollapsed)
	}, [isSidebarCollapsed, setIsSidebarCollapsed])

	return (
		<div
			ref={headerRef}
			className={cn('', className)}
			data-module-resource-list={MODULE_RESOURCE_LIST_DATA_ATTRS.header}
		>
			{isCollapsible && (
				<TooltipProvider>
					<Tooltip delayDuration={0}>
						<TooltipTrigger asChild>
							<Button
								className={cn(
									'absolute right-1.5 top-1.5 z-50 hidden size-8 p-1 transition lg:flex',
									{
										'right-0.5': isSidebarCollapsed,
									},
								)}
								variant="ghost"
								size="icon"
								onClick={handleToggle}
								aria-label={
									isSidebarCollapsed ? 'Open sidebar' : 'Collapse sidebar'
								}
								aria-expanded={!isSidebarCollapsed}
							>
								{isSidebarCollapsed ? (
									<PanelLeftOpen className="h-4 w-4" />
								) : (
									<PanelLeftClose className="h-4 w-4" />
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent className="z-1000" side="left">
							{isSidebarCollapsed ? 'Open sidebar' : 'Collapse sidebar'}
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}

			{moduleNavigation.type !== 'list' && (
				<div className="flex min-w-0 text-xs opacity-75">
					<Link
						className="hover:text-primary block w-full truncate capitalize"
						href={
							parentContext?.slug
								? `/cohorts/${parentContext.slug}`
								: `/browse?type=${moduleNavigation?.type || ''}`
						}
					>
						{parentContext?.title ?? pluralize(moduleNavigation.type)} {'/'}
					</Link>
				</div>
			)}
			<Link
				className="hover:text-primary font-semibold"
				href={getResourcePath(
					moduleNavigation.type,
					moduleNavigation.fields?.slug,
					'view',
				)}
			>
				{moduleNavigation.fields?.title}
			</Link>
			<AutoPlayToggle className="mt-1 origin-left scale-90" />
		</div>
	)
}
