'use client'

import * as React from 'react'
import Link from 'next/link'
import { useWorkshopNavigation } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import { getFirstLessonSlug } from '@/lib/workshops'

import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

export function StartLearningWorkshopButton({
	moduleSlug,
	className,
}: {
	moduleSlug: string
	className?: string
}) {
	const workshopNavigation = useWorkshopNavigation()
	const firstLessonSlug = getFirstLessonSlug(workshopNavigation)

	return (
		<Button
			size="lg"
			className={cn(
				'before:bg-primary-foreground relative h-14 w-full rounded-none text-base font-medium before:absolute before:-left-1 before:h-2 before:w-2 before:rotate-45 before:content-[""] sm:max-w-[180px]',
				className,
			)}
			asChild
		>
			<Link prefetch href={`/workshops/${moduleSlug}/${firstLessonSlug}`}>
				Start Learning
			</Link>
		</Button>
	)
}
