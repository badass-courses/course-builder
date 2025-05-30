'use client'

import Link from 'next/link'
import { useModuleProgress } from '@/app/(content)/_components/module-progress-provider'
import { getResourcePath } from '@/utils/resource-paths'
import { Check } from 'lucide-react'

import type { ContentResource } from '@coursebuilder/core/schemas'

export function WorkshopLessonItem({
	resource,
	workshopSlug,
}: {
	resource: ContentResource
	workshopSlug: string
}) {
	const { moduleProgress } = useModuleProgress()
	const isLessonCompleted = moduleProgress?.completedLessons.some(
		(lesson) => lesson.resourceId === resource.id,
	)
	return (
		<li key={resource?.id} className="relative w-full">
			<Link
				className="text-foreground/90 hover:text-primary hover:bg-muted/50 inline-flex w-full items-center py-2.5 pl-10 pr-10 text-base font-medium transition ease-in-out"
				href={getResourcePath(resource.type, resource.fields?.slug, 'view', {
					parentSlug: workshopSlug,
					parentType: 'workshop',
				})}
			>
				{isLessonCompleted && (
					<Check className="text-primary absolute left-3 size-4" />
				)}
				{resource?.fields?.title}
			</Link>
		</li>
	)
}
