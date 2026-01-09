'use client'

import * as React from 'react'
import Link from 'next/link'
import { createAppAbility } from '@/ability'
import { api } from '@/trpc/react'
import pluralize from 'pluralize'

import type { Product } from '@coursebuilder/core/schemas'
import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

export type ResourceAdminActionsProps = {
	/** Resource type (e.g., 'workshop', 'event', 'cohort', 'list') */
	resourceType: 'workshop' | 'event' | 'cohort' | 'list'
	/** Resource slug or ID */
	resourceSlugOrId: string
	/** Optional product - if provided, shows "Edit Product" button */
	product?: Product | null
	/** Optional display label override (e.g., "Event Series" instead of "Event") */
	resourceLabel?: string
	/** Additional CSS classes */
	className?: string
}

/**
 * Unified admin actions for resource landing pages.
 *
 * Displays:
 * - "Edit Product" button (if product is provided)
 * - "Edit {ResourceType}" button
 *
 * Only renders if user has 'update' permission for Content.
 */
export function ResourceAdminActions({
	resourceType,
	resourceSlugOrId,
	product,
	resourceLabel,
	className,
}: ResourceAdminActionsProps) {
	const { data: abilityRules, status } =
		api.ability.getCurrentAbilityRules.useQuery()
	const ability = createAppAbility(abilityRules || [])

	if (status !== 'success' || !ability.can('update', 'Content')) {
		return null
	}

	const displayLabel =
		resourceLabel ||
		resourceType.charAt(0).toUpperCase() + resourceType.slice(1)
	const editUrl = `/${pluralize(resourceType)}/${resourceSlugOrId}/edit`

	return (
		<div className={cn('flex items-center gap-2', className)}>
			{product && (
				<Button asChild size="sm" variant="outline">
					<Link href={`/products/${product?.fields?.slug || product?.id}/edit`}>
						Edit Product
					</Link>
				</Button>
			)}
			<Button asChild size="sm" variant="secondary">
				<Link href={editUrl}>Edit {displayLabel}</Link>
			</Button>
		</div>
	)
}
