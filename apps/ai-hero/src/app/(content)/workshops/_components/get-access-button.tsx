'use client'

import { use } from 'react'
import Link from 'next/link'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { Button } from '@coursebuilder/ui'
import type { AbilityForResource } from '@coursebuilder/utils-auth/current-ability-rules'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

export default function GetAccessButton({
	moduleSlug,
	abilityLoader,
	className,
}: {
	moduleSlug: string
	abilityLoader: Promise<
		Omit<AbilityForResource, 'canView'> & {
			canViewWorkshop: boolean
			canViewLesson: boolean
			isPendingOpenAccess: boolean
		}
	>
	className?: string
}) {
	const ability = use(abilityLoader)
	const canView = ability.canViewWorkshop
	if (canView) return null

	return (
		<Button asChild className={className}>
			<Link href={getResourcePath('workshop', moduleSlug, 'view')}>
				Get Full Access
			</Link>
		</Button>
	)
}
