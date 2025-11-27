'use client'

import * as React from 'react'
import { cn } from '@/utils/cn'

interface WorkshopModulesProps {
	children: React.ReactNode
	className?: string
}

/**
 * Container for workshop module descriptions.
 * Provides consistent spacing and automatic numbering.
 *
 * @example
 * ```mdx
 * <WorkshopModules>
 *   <WorkshopModule title="MCP Fundamentals" focus="Setup, Tools, Resources & Prompts">
 *     Master the core building blocks...
 *   </WorkshopModule>
 * </WorkshopModules>
 * ```
 */
export function WorkshopModules({ children, className }: WorkshopModulesProps) {
	return (
		<div
			className={cn(
				'not-prose my-10 grid gap-6 [counter-reset:module] sm:grid-cols-1',
				className,
			)}
		>
			{children}
		</div>
	)
}

interface WorkshopModuleProps {
	children: React.ReactNode
	/** Workshop title */
	title: string
	/** Focus areas or subtitle */
	focus?: string
	className?: string
}

/**
 * Individual workshop module card with title, focus area, and description.
 * Auto-numbers based on position.
 */
export function WorkshopModule({
	children,
	title,
	focus,
	className,
}: WorkshopModuleProps) {
	return (
		<article
			className={cn(
				'group relative flex flex-col [counter-increment:module]',
				'bg-card border-border overflow-hidden rounded-xl border',
				'animate-in fade-in-0 slide-in-from-bottom-4',
				className,
			)}
		>
			{/* Header with number and title */}
			<div className="bg-muted/50 border-border flex items-start gap-4 border-b px-5 py-4">
				<div className="dark:bg-primary/20 bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold before:content-[counter(module)]" />
				<div className="flex flex-col gap-1">
					<h4 className="text-foreground text-lg font-bold leading-tight">
						{title}
					</h4>
					{focus && (
						<p className="text-muted-foreground text-sm">
							<span className="font-medium">Focus:</span> {focus}
						</p>
					)}
				</div>
			</div>

			{/* Description */}
			<div className="text-muted-foreground [&_strong]:text-foreground flex-1 p-5 pb-1 text-[1rem] leading-relaxed [&_p]:mb-4 [&_strong]:font-semibold">
				{children}
			</div>
		</article>
	)
}
