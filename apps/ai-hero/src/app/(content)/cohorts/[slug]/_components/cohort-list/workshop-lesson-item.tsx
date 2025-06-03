'use client'

import Link from 'next/link'
import { useModuleProgress } from '@/app/(content)/_components/module-progress-provider'
import { getResourcePath } from '@/utils/resource-paths'
import { Check } from 'lucide-react'

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
	const isLessonCompleted = moduleProgress?.completedLessons.some(
		(lesson) => lesson.resourceId === resource.id,
	)
	return (
		<li key={resource?.id} className="relative w-full">
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
		</li>
	)
}
