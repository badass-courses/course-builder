'use client'

import * as React from 'react'
import Link from 'next/link'
import { useWorkshopNavigation } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import Spinner from '@/components/spinner'
import { getFirstResourceSlug } from '@/lib/content-navigation'
import { MinimalWorkshop } from '@/lib/workshops'
import { formatInTimeZone } from 'date-fns-tz'
import { Github } from 'lucide-react'

import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'
import type { AbilityForResource } from '@coursebuilder/utils-auth/current-ability-rules'

import { useModuleProgress } from '../../_components/module-progress-provider'

export function StartLearningWorkshopButton({
	productType,
	abilityLoader,
	moduleSlug,
	className,
	workshop,
}: {
	productType?: 'self-paced' | 'live' | 'membership' | 'cohort'
	abilityLoader: Promise<
		Omit<AbilityForResource, 'canView'> & {
			canViewWorkshop: boolean
			canViewLesson: boolean
			isPendingOpenAccess: boolean
		}
	>
	moduleSlug: string
	className?: string
	workshop: MinimalWorkshop
}) {
	const workshopNavigation = useWorkshopNavigation()
	const firstLessonSlug = getFirstResourceSlug(workshopNavigation)
	const { moduleProgress } = useModuleProgress()
	const isWorkshopInProgress =
		moduleProgress?.nextResource?.fields?.slug &&
		moduleProgress?.completedLessons?.length > 0

	const url = isWorkshopInProgress
		? `/workshops/${moduleSlug}/${moduleProgress?.nextResource?.fields?.slug}`
		: `/workshops/${moduleSlug}/${firstLessonSlug}`
	const { canViewWorkshop: canView, isPendingOpenAccess } =
		React.use(abilityLoader)

	if (isPendingOpenAccess && workshop?.fields?.startsAt) {
		const formattedDate = formatInTimeZone(
			new Date(workshop?.fields?.startsAt || ''),
			'America/Los_Angeles',
			`MMM d, yyyy 'at' h:mm a`,
		)

		return (
			<Button
				size="lg"
				className={cn(
					'text-foreground before:bg-primary-foreground relative h-14 w-full rounded-none text-sm font-medium before:absolute before:-left-1 before:h-2 before:w-2 before:rotate-45 before:content-[""] hover:cursor-not-allowed sm:max-w-[277px]',
					className,
					'border-r bg-transparent',
				)}
				disabled
			>
				Available {formattedDate} (PT)
			</Button>
		)
	}

	if (productType === 'cohort') {
		// preview not available
		return null
	}

	if (!canView) {
		return null
	}

	return (
		<>
			<Button
				size="lg"
				className={cn(
					'before:bg-primary-foreground relative h-14 w-full rounded-none text-base font-medium before:absolute before:-left-1 before:h-2 before:w-2 before:rotate-45 before:content-[""] sm:max-w-[180px]',
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
	abilityLoader: Promise<
		Omit<AbilityForResource, 'canView'> & {
			canViewWorkshop: boolean
			canViewLesson: boolean
			isPendingOpenAccess: boolean
		}
	>
	className?: string
}) {
	const { canViewWorkshop: canView } = React.use(abilityLoader)
	const workshopNavigation = useWorkshopNavigation()
	const cohort = workshopNavigation?.parents?.[0]
	if (canView || !cohort) return null

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
			<Link prefetch href={`/cohorts/${cohort?.fields?.slug}`}>
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

export function WorkshopGitHubRepoLink({
	githubUrl,
	abilityLoader,
}: {
	githubUrl?: string
	abilityLoader: Promise<
		Omit<AbilityForResource, 'canView'> & {
			canViewWorkshop: boolean
			canViewLesson: boolean
			isPendingOpenAccess: boolean
		}
	>
}) {
	const { canViewWorkshop: canView } = React.use(abilityLoader)
	if (!githubUrl) return null
	if (!canView) return null
	return (
		<Button
			asChild
			size="lg"
			variant="ghost"
			className="flex h-14 items-center gap-2 rounded-none border-r"
		>
			<Link href={githubUrl} target="_blank" rel="noopener noreferrer">
				<Github className="size-4" /> Code
			</Link>
		</Button>
	)
}
