'use client'

import Link from 'next/link'
import { createAppAbility } from '@/ability'
import { useModuleProgress } from '@/app/(content)/_components/module-progress-provider'
import { useWorkshopNavigation } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import { api } from '@/trpc/react'
import { getResourcePath } from '@/utils/resource-paths'
import { subject } from '@casl/ability'
import { Check, Lock } from 'lucide-react'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { cn } from '@coursebuilder/ui/utils/cn'

export function WorkshopLessonItem({
	resource,
	workshopSlug,
	className,
	index,
}: {
	resource: ContentResource
	workshopSlug: string
	className?: string
	index: number
}) {
	const { moduleProgress } = useModuleProgress()
	const workshopNavigation = useWorkshopNavigation()
	const isLessonCompleted = moduleProgress?.completedLessons.some(
		(lesson) => lesson.resourceId === resource.id,
	)

	const { data: abilityRules, status: abilityStatus } =
		api.ability.getCurrentAbilityRules.useQuery(
			{
				moduleId: workshopNavigation?.id,
				lessonId: resource.fields?.slug,
			},
			{
				enabled: !!workshopNavigation?.id,
			},
		)

	const ability = createAppAbility(abilityRules || [])

	const canViewLesson = ability.can(
		'read',
		subject('Content', { id: resource.id }),
	)

	return (
		<li key={resource?.id} className="relative w-full">
			{canViewLesson ? (
				<Link
					className={cn(
						'text-foreground/90 hover:text-primary hover:bg-muted/50 inline-flex w-full items-center py-2.5 pl-10 pr-10 text-base font-medium transition ease-in-out',
						className,
					)}
					href={getResourcePath(resource.type, resource.fields?.slug, 'view', {
						parentSlug: workshopSlug,
						parentType: 'workshop',
					})}
				>
					{isLessonCompleted ? (
						<Check className="text-primary absolute left-3 size-4" />
					) : (
						<span className="absolute left-3 pl-1 text-xs tabular-nums opacity-75">
							{index}
						</span>
					)}
					{resource?.fields?.title}
				</Link>
			) : (
				<span
					className={cn(
						'text-foreground/50 inline-flex w-full cursor-not-allowed items-center py-2.5 pl-10 pr-10 text-base font-medium transition ease-in-out',
						className,
					)}
				>
					{isLessonCompleted ? (
						<Check className="text-primary absolute left-3 size-4" />
					) : (
						<span className="absolute left-3 pl-1 text-xs tabular-nums opacity-75">
							{index}
						</span>
					)}
					{resource?.fields?.title}
					<Lock
						className="absolute right-5 w-3 text-gray-500"
						aria-label="locked"
					/>
				</span>
			)}
		</li>
	)
}
