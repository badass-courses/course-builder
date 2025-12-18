import * as React from 'react'

import { cn } from '@coursebuilder/ui/utils/cn'

export type ResourceBodyProps = {
	/** Article content */
	children: React.ReactNode
	/** Additional CSS classes */
	className?: string
}

/**
 * Article body wrapper with consistent prose styling.
 *
 * Provides the standard prose configuration used across resource pages.
 */
export function ResourceBody({ children, className }: ResourceBodyProps) {
	return <article className={cn('p-5 lg:p-8', className)}>{children}</article>
}
