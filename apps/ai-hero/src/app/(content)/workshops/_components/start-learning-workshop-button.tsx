'use client'

import * as React from 'react'
import Link from 'next/link'
import { useWorkshopNavigation } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import Spinner from '@/components/spinner'
import { getFirstLessonSlug } from '@/lib/workshops'

import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

import { useModuleProgress } from '../../_components/module-progress-provider'

export function StartLearningWorkshopButton({
	moduleSlug,
	className,
}: {
	moduleSlug: string
	className?: string
}) {
	const workshopNavigation = useWorkshopNavigation()
	const firstLessonSlug = getFirstLessonSlug(workshopNavigation)
	const { moduleProgress } = useModuleProgress()
	const isWorkshopInProgress =
		moduleProgress?.nextResource?.fields?.slug &&
		moduleProgress?.completedLessons?.length > 0

	const url = isWorkshopInProgress
		? `/workshops/${moduleSlug}/${moduleProgress?.nextResource?.fields?.slug}`
		: `/workshops/${moduleSlug}/${firstLessonSlug}`
	return (
		<>
			<Button
				size="lg"
				className={cn(
					'before:bg-primary-foreground relative h-14 w-full rounded-none text-base font-medium before:absolute before:-left-1 before:h-2 before:w-2 before:rotate-45 before:content-[""] sm:max-w-[180px]',
					className,
				)}
				asChild
			>
				<Link prefetch href={url}>
					{!moduleProgress && 'Loading...'}
					{moduleProgress && (
						<>{isWorkshopInProgress ? 'Continue Learning' : 'Start Learning'}</>
					)}
				</Link>
			</Button>
		</>
	)
}
