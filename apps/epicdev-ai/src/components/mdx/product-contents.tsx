'use client'

import * as React from 'react'
import { cn } from '@/utils/cn'

interface ProductContentsProps {
	children: React.ReactNode
	/** Product/course title */
	title: string
	className?: string
}

/**
 * Simple overview card showing a product and its included workshops.
 *
 * @example
 * ```mdx
 * <ProductContents title="Epic MCP from Scratch to Production">
 *   <Workshop>MCP Fundamentals</Workshop>
 *   <Workshop>Authorization</Workshop>
 * </ProductContents>
 * ```
 */
export function ProductContents({
	children,
	title,
	className,
}: ProductContentsProps) {
	return (
		<div
			className={cn(
				'not-prose bg-card border-border my-8 overflow-hidden rounded-xl border [counter-reset:workshop]',
				className,
			)}
		>
			<div className="bg-primary/10 dark:bg-primary/5 border-border border-b px-5 py-4">
				<h4 className="text-foreground text-lg font-bold">{title}</h4>
			</div>
			<ul className="divide-border divide-y">{children}</ul>
		</div>
	)
}

interface WorkshopProps {
	children: React.ReactNode
	className?: string
}

/**
 * Individual workshop item within ProductContents.
 */
export function Workshop({ children, className }: WorkshopProps) {
	return (
		<li
			className={cn(
				'flex items-center gap-3 px-5 py-3 [counter-increment:workshop]',
				className,
			)}
		>
			<span className="text-primary text-sm font-semibold tabular-nums before:content-[counter(workshop)]" />
			<span className="text-muted-foreground text-[0.95rem]">{children}</span>
		</li>
	)
}
