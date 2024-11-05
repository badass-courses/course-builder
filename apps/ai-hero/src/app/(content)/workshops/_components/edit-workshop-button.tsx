'use client'

import * as React from 'react'
import Link from 'next/link'
import { createAppAbility } from '@/ability'
import { api } from '@/trpc/react'
import pluralize from 'pluralize'

import { Button } from '@coursebuilder/ui'

export function EditWorkshopButton({
	moduleType,
	moduleSlug,
}: {
	moduleType: string
	moduleSlug: string
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
							className="absolute right-5 top-5 gap-1"
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
