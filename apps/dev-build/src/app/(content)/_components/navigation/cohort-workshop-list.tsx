'use client'

import * as React from 'react'
import Link from 'next/link'
import { createAppAbility } from '@/ability'
import type { ResourceNavigation } from '@/lib/content-navigation'
import type { Workshop } from '@/lib/workshops'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { formatCohortDateRange } from '@/utils/format-cohort-date'

import type { ModuleProgress } from '@coursebuilder/core/schemas'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@coursebuilder/ui'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

import {
	ModuleProgressProvider,
	useModuleProgress,
} from '../module-progress-provider'
import { ModuleResourceListLesson } from './module-resource-list-lesson'
import { ContentNavigationProvider, useContentNavigation } from './provider'

/**
 * Workshop data with pre-created loaders for progress and navigation.
 * These loaders (promises) must be created in a server component.
 */
export type WorkshopWithLoaders = {
	workshop: Workshop
	moduleProgressLoader: Promise<ModuleProgress | null>
	workshopNavDataLoader: Promise<ResourceNavigation | null>
}

type CohortWorkshopListProps = {
	workshopsWithLoaders: WorkshopWithLoaders[]
	className?: string
}

/**
 * Renders a list of workshops for a cohort, with each workshop as an expandable
 * accordion section showing its lessons. Each workshop is wrapped with its own
 * progress and navigation providers.
 *
 * @note The loaders (promises) must be created in a server component and passed here.
 * Do not call server functions directly in this client component.
 */
export function CohortWorkshopList({
	workshopsWithLoaders,
	className,
}: CohortWorkshopListProps) {
	return (
		<ul className={cn('flex flex-col gap-3', className)}>
			{workshopsWithLoaders.map(
				({ workshop, moduleProgressLoader, workshopNavDataLoader }, index) => (
					<ModuleProgressProvider
						key={workshop.id}
						moduleProgressLoader={moduleProgressLoader}
					>
						<ContentNavigationProvider
							navigationDataLoader={workshopNavDataLoader}
						>
							<CohortWorkshopItem workshop={workshop} index={index} />
						</ContentNavigationProvider>
					</ModuleProgressProvider>
				),
			)}
		</ul>
	)
}

type CohortWorkshopItemProps = {
	workshop: Workshop
	index: number
}

/**
 * Renders a single workshop item within the cohort workshop list,
 * consuming navigation context to display lessons.
 */
function CohortWorkshopItem({ workshop, index }: CohortWorkshopItemProps) {
	const moduleNavigation = useContentNavigation()
	const { moduleProgress } = useModuleProgress()

	const { data: abilityRules, status: abilityStatus } =
		api.ability.getCurrentAbilityRules.useQuery(
			{
				moduleId: moduleNavigation?.id,
			},
			{
				enabled: !!moduleNavigation?.id,
			},
		)

	const ability = React.useMemo(
		() => createAppAbility(abilityRules || []),
		[abilityRules],
	)

	if (!moduleNavigation) {
		return null
	}

	const { dateString } = formatCohortDateRange(
		workshop.fields.startsAt,
		null,
		workshop.fields.timezone || 'America/Los_Angeles',
	)

	return (
		<Accordion type="multiple" defaultValue={[workshop.id]}>
			<AccordionItem
				value={workshop.id}
				className="bg-card shadow-xs overflow-hidden rounded border"
			>
				<div className="relative flex items-stretch justify-between border-b">
					<Link
						className="text-foreground hover:text-primary flex flex-col py-2 pl-4 pt-3 text-lg font-semibold leading-tight transition ease-in-out"
						href={getResourcePath('workshop', workshop.fields.slug, 'view')}
					>
						{workshop.fields.title}
						{dateString && (
							<div className="mt-1 text-sm font-normal opacity-80">
								Available from {dateString}
							</div>
						)}
					</Link>
					<AccordionTrigger
						aria-label="Toggle lessons"
						className="hover:bg-muted [&_svg]:hover:text-primary flex aspect-square h-full w-full shrink-0 items-center justify-center rounded-none border-l bg-transparent"
					/>
				</div>
				<AccordionContent className="pb-2">
					<ol className="list-inside list-none">
						{moduleNavigation.resources?.map((wrapper, lessonIndex) => {
							if (!wrapper.resource) return null
							return (
								<ModuleResourceListLesson
									key={wrapper.resource.id}
									className="pl-10 [&_[data-state]]:left-5"
									lesson={wrapper.resource}
									index={lessonIndex}
									parentIndex={index}
									moduleProgress={moduleProgress}
									ability={ability}
									abilityStatus={abilityStatus}
									moduleId={moduleNavigation.id}
								/>
							)
						})}
					</ol>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	)
}
