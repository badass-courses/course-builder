'use client'

import * as React from 'react'
import Link from 'next/link'
import { createAppAbility } from '@/ability'
import { api } from '@/trpc/react'
import pluralize from 'pluralize'

import type { Product } from '@coursebuilder/core/schemas'
import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

export function EditWorkshopButton({
	moduleType,
	moduleSlug,
	className,
	product,
}: {
	moduleType: string
	moduleSlug: string
	className?: string
	product?: Product | null
}) {
	const { data: abilityRules, status } =
		api.ability.getCurrentAbilityRules.useQuery()
	const ability = createAppAbility(abilityRules || [])

	return (
		<>
			{status === 'success' && (
				<>
					{ability.can('update', 'Content') && (
						<div
							className={cn(
								'absolute right-5 top-2 z-20 flex items-center justify-center gap-2',
								className,
							)}
						>
							<Button asChild size="sm" variant="outline">
								<Link
									className="capitalize"
									href={`/${pluralize(moduleType)}/${moduleSlug}/edit`}
								>
									Edit {moduleType}
								</Link>
							</Button>
							{product && (
								<Button asChild size="sm" variant="outline">
									<Link
										href={`/products/${product?.fields?.slug || product?.id}/edit`}
									>
										Edit Product
									</Link>
								</Button>
							)}
						</div>
					)}
				</>
			)}
		</>
	)
}
