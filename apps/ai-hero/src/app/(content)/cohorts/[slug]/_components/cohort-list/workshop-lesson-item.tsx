'use client'

import Link from 'next/link'
import { type AppAbility } from '@/ability'
import { useModuleProgress } from '@/app/(content)/_components/module-progress-provider'
import { useWorkshopNavigation } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import { api } from '@/trpc/react'
import { subject } from '@casl/ability'
import { Check, Lock } from 'lucide-react'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { cn } from '@coursebuilder/ui/utils/cn'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

export function WorkshopLessonItem({
	resource,
	workshopSlug,
	className,
	index,
	ability,
	abilityStatus,
}: {
	resource: ContentResource
	workshopSlug: string
	className?: string
	index: string
	ability: AppAbility
	abilityStatus: 'error' | 'success' | 'pending'
}) {
	const { moduleProgress } = useModuleProgress()
	const isLessonCompleted = moduleProgress?.completedLessons.some(
		(lesson) => lesson.resourceId === resource.id,
	)

	const canViewLesson = ability.can(
		'read',
		subject('Content', { id: resource.id }),
	)

	return (
		<li key={resource?.id} className="relative w-full">
			{canViewLesson ? (
				<Link
					className={cn(
						'text-foreground/90 hover:dark:text-primary hover:bg-muted/50 inline-flex w-full items-center py-2.5 pl-10 pr-10 text-base font-medium transition ease-in-out hover:text-blue-600',
						className,
					)}
					href={getResourcePath(resource.type, resource.fields?.slug, 'view', {
						parentSlug: workshopSlug,
						parentType: 'workshop',
					})}
				>
					{isLessonCompleted ? (
						<Check
							data-state=""
							className="text-primary absolute left-4 size-3"
						/>
					) : (
						<span
							data-state=""
							className="absolute left-3 pl-1 text-[10px] opacity-75"
						>
							{index}
						</span>
					)}
					{resource?.fields?.title}
				</Link>
			) : (
				<span
					className={cn(
						'text-foreground/50 inline-flex w-full cursor-not-allowed items-center py-2.5 pl-10 pr-10 text-base font-normal transition ease-in-out',
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
