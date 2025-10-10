'use client'

import { createAppAbility } from '@/ability'
import { useWorkshopNavigation } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import type { Workshop } from '@/lib/workshops'
import { api } from '@/trpc/react'

import { cn } from '@coursebuilder/ui/utils/cn'

import { WorkshopLessonItem } from './workshop-lesson-item'

export function WorkshopLessonList({
	workshop,
	className,
}: {
	workshop: Workshop
	className?: string
}) {
	const workshopNavigation = useWorkshopNavigation()

	const { data: abilityRules, status: abilityStatus } =
		api.ability.getCurrentAbilityRules.useQuery(
			{
				moduleId: workshopNavigation?.id,
			},
			{
				enabled: !!workshopNavigation?.id,
			},
		)

	const ability = createAppAbility(abilityRules || [])

	return (
		<>
			{workshop.resources?.map(({ resource }, index) => {
				return (
					<WorkshopLessonItem
						index={index + 1}
						className={cn('pl-13 rounded', className)}
						key={resource.id}
						resource={resource}
						workshopSlug={workshop.fields.slug}
						ability={ability}
						abilityStatus={abilityStatus}
					/>
				)
			})}
		</>
	)
}
