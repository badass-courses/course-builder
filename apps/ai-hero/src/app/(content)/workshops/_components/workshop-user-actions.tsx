'use client'

import * as React from 'react'
import Link from 'next/link'
import { useWorkshopNavigation } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import Spinner from '@/components/spinner'
import { getFirstLessonSlug } from '@/lib/workshops'
import { track } from '@/utils/analytics'
import { Github } from 'lucide-react'

import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'
import type { AbilityForResource } from '@coursebuilder/utils-auth/current-ability-rules'

import { useModuleProgress } from '../../_components/module-progress-provider'

export function StartLearningWorkshopButton({
	abilityLoader,
	moduleSlug,
	className,
}: {
	abilityLoader: Promise<AbilityForResource>
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
	const { canView } = React.use(abilityLoader)

	return (
		<>
			<Button
				size="lg"
				className={cn(
					'before:bg-primary-foreground relative h-14 w-full rounded-none text-sm font-medium before:absolute before:-left-1 before:h-2 before:w-2 before:rotate-45 before:content-[""] sm:max-w-[180px]',
					className,
					{
						'text-foreground hover:bg-secondary border-r bg-transparent before:hidden sm:max-w-[120px]':
							!canView,
					},
				)}
				asChild
			>
				<Link prefetch href={url}>
					{canView ? (
						<>
							{!moduleProgress && 'Loading...'}
							{moduleProgress && (
								<>
									{isWorkshopInProgress
										? 'Continue Learning'
										: 'Start Learning'}
								</>
							)}
						</>
					) : (
						'Preview'
					)}
				</Link>
			</Button>
		</>
	)
}

export function GetAccessButton({
	abilityLoader,
	className,
}: {
	abilityLoader: Promise<AbilityForResource>
	className?: string
}) {
	const { canView } = React.use(abilityLoader)
	const workshopNavigation = useWorkshopNavigation()
	const cohort = workshopNavigation?.cohorts[0]
	if (canView) return null

	return (
		<Button
			size="lg"
			className={cn(
				'before:bg-primary-foreground relative h-14 w-full rounded-none text-sm font-medium before:absolute before:-left-1 before:h-2 before:w-2 before:rotate-45 before:content-[""] sm:max-w-[180px]',
				className,
				{
					'text-primary-foreground bg-primary hover:bg-primary/80 border-r':
						!canView,
				},
			)}
			asChild
		>
			<Link prefetch href={`/cohorts/${cohort?.slug}`}>
				Get Access
			</Link>
		</Button>
	)
}

export function StartLearningWorkshopButtonSkeleton() {
	return (
		<Button
			size="lg"
			className='text-foreground/75 before:bg-primary-foreground relative flex h-14 w-full gap-2 rounded-none border-r bg-transparent text-sm font-medium before:absolute before:-left-1 before:h-2 before:w-2 before:rotate-45 before:content-[""] hover:bg-transparent sm:max-w-[277px]'
		>
			<Spinner className="w-3" /> Checking your access...
		</Button>
	)
}

export function ContentTitle(
	{
		// abilityLoader,
	}: {
		// abilityLoader: Promise<AbilityForResource>
	},
) {
	// const { canView } = React.use(abilityLoader)
	// if (!canView) return null

	return (
		<div className="col-span-2 hidden h-14 items-center border-l pl-5 text-base font-medium md:flex">
			Content
		</div>
	)
}

export function WorkshopGitHubRepoLink({ githubUrl }: { githubUrl?: string }) {
	if (!githubUrl) return null
	return (
		<Button
			asChild
			size="lg"
			variant="ghost"
			className="flex h-14 w-full items-center gap-2 rounded-none border-r"
		>
			<Link href={githubUrl} target="_blank" rel="noopener noreferrer">
				<Github className="size-4" /> GitHub
			</Link>
		</Button>
	)
}
