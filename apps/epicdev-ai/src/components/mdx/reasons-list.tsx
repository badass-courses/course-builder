'use client'

import * as React from 'react'
import { cn } from '@/utils/cn'

interface ReasonsListProps {
	children: React.ReactNode
	/** Optional title displayed above the list */
	title?: string
	className?: string
}

/**
 * Container for a list of highlighted reasons/benefits.
 * Wraps Reason components and provides automatic numbering via CSS counters.
 *
 * @example
 * ```mdx
 * <ReasonsList title="5 reasons to learn MCP now">
 *   <Reason headline="MCP is powerful" subline="when you do it right">
 *     Supporting explanation text...
 *   </Reason>
 * </ReasonsList>
 * ```
 */
export function ReasonsList({ children, title, className }: ReasonsListProps) {
	return (
		<section className={cn('not-prose my-12', className)}>
			{title && (
				<h3 className="text-foreground mb-8 text-xl font-bold sm:text-2xl">
					{title}
				</h3>
			)}
			<ol className="flex flex-col gap-6 [counter-reset:reason]">{children}</ol>
		</section>
	)
}

interface ReasonProps {
	children: React.ReactNode
	/** Main headline - the key point */
	headline: string
	/** Optional subline for emphasis (e.g., "now", "when you do it right") */
	subline?: string
	className?: string
}

/**
 * Individual reason card with prominent numbering and headline.
 * Auto-numbers based on position in the list.
 */
export function Reason({
	children,
	headline,
	subline,
	className,
}: ReasonProps) {
	return (
		<li
			className={cn(
				'group relative [counter-increment:reason]',
				'bg-card border-border rounded-xl border p-6',
				'animate-in fade-in-0 slide-in-from-bottom-4',
				className,
			)}
		>
			<div className="flex gap-5">
				{/* Big number */}
				<div className="text-primary/20 select-none text-6xl font-black leading-none before:content-[counter(reason)]" />

				<div className="flex flex-1 flex-col gap-3 pt-1">
					{/* Headline + subline */}
					<h4 className="text-foreground text-lg font-semibold leading-snug sm:text-xl">
						{headline}
						{subline && (
							<span className="text-primary font-bold"> {subline}</span>
						)}
					</h4>

					{/* Supporting text */}
					<div className="text-muted-foreground [&_strong]:text-foreground [&_em]:text-foreground text-[0.95rem] leading-relaxed [&_strong]:font-semibold">
						{children}
					</div>
				</div>
			</div>
		</li>
	)
}
