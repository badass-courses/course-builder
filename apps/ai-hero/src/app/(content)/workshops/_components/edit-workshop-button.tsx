'use client'

import * as React from 'react'
import Link from 'next/link'
import { createAppAbility } from '@/ability'
import { api } from '@/trpc/react'
import pluralize from 'pluralize'

import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

export function EditWorkshopButton({
	moduleType,
	moduleSlug,
	className,
}: {
	moduleType: string
	moduleSlug: string
	className?: string
}) {
	const { data: abilityRules, status } =
		api.ability.getCurrentAbilityRules.useQuery()
	const ability = createAppAbility(abilityRules || [])

	return (
		<>
			{status === 'success' && (
				<>
					{ability.can('update', 'Content') && (
						<Button
							asChild
							variant="secondary"
							className={cn('absolute right-5 top-5 gap-1', className)}
						>
							<Link href={`/${pluralize(moduleType)}/${moduleSlug}/edit`}>
								Edit
							</Link>
						</Button>
					)}
				</>
			)}
		</>
	)
}
