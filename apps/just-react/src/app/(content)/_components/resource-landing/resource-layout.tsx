import * as React from 'react'
import LayoutClient from '@/components/layout-client'
import type { SaleBannerData } from '@/lib/sale-banner'

import { cn } from '@coursebuilder/ui/utils/cn'

import { ResourceVisibilityBanner } from './resource-visibility-banner'

export type ResourceLayoutProps = {
	saleBannerData: SaleBannerData | null
	/** Main content area (8 cols) */
	children: React.ReactNode
	/** Sidebar content (4 cols) */
	sidebar: React.ReactNode
	/** Additional CSS classes for the container */
	className?: string
	/** CSS classes for the main content area */
	mainClassName?: string
	/** CSS classes for the sidebar area */
	sidebarClassName?: string
}

/**
 * Grid layout wrapper for resource landing pages.
 *
 * Provides consistent 8/4 main/sidebar grid layout used across:
 * - Events
 * - Workshops
 * - Cohorts
 * - Lists
 *
 * Responsive: stacks on mobile, grid on lg+
 */
export function ResourceLayout({
	saleBannerData,
	children,
	sidebar,
	className,
	mainClassName,
	sidebarClassName,
}: ResourceLayoutProps) {
	return (
		<LayoutClient
			withContainer
			saleBannerData={saleBannerData}
			className="px-0"
		>
			<div
				className={cn('relative flex grid-cols-12 flex-col lg:grid', className)}
			>
				<div className={cn('col-span-8', mainClassName)}>{children}</div>
				<div className={cn('col-span-4', sidebarClassName)}>{sidebar}</div>
			</div>
		</LayoutClient>
	)
}
