'use client'

import * as React from 'react'
import Link from 'next/link'
import { useWorkshopNavigation } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import Spinner from '@/components/spinner'
import { getFirstLessonSlug, MinimalWorkshop } from '@/lib/workshops'
import { formatInTimeZone } from 'date-fns-tz'
import { Github, LockIcon } from 'lucide-react'

import type { ProductType } from '@coursebuilder/core/schemas'
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
	productType?: ProductType
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
	const firstLessonSlug = getFirstLessonSlug(workshopNavigation)
	const { moduleProgress } = useModuleProgress()
	const isWorkshopInProgress =
		moduleProgress?.nextResource?.fields?.slug &&
		moduleProgress?.completedLessons?.length > 0

	const url = isWorkshopInProgress
		? `/workshops/${moduleSlug}/${moduleProgress?.nextResource?.fields?.slug}`
		: firstLessonSlug && `/workshops/${moduleSlug}/${firstLessonSlug}`
	const { canViewWorkshop: canView, isPendingOpenAccess } =
		React.use(abilityLoader)

	if (isPendingOpenAccess && workshop?.fields?.startsAt) {
		const formattedDate = formatInTimeZone(
			new Date(workshop?.fields?.startsAt || ''),
			'America/Los_Angeles',
			`MMM d, yyyy 'at' h:mm a`,
		)

		return (
			<div
				className={cn(
					'text-foreground relative flex h-12 w-full items-center justify-center rounded-lg px-5 text-sm font-medium sm:w-auto',
					className,
					'bg-muted border shadow-[0px_4px_38px_-14px_rgba(0,_0,_0,_0.1)]',
				)}
			>
				<LockIcon className="mr-2 size-4" /> Available {formattedDate} (PT)
			</div>
		)
	}

	if (productType === 'cohort') {
		// preview not available
		return null
	}

	if (!canView) {
		return null
	}

	if (!url) return null

	// preview not available
	return (
		<>
			<Button
				size="lg"
				className={cn(
					'from-primary relative h-12 w-full rounded-lg bg-gradient-to-b to-indigo-800 text-sm font-medium text-white shadow-[0px_4px_38px_-14px_rgba(0,_0,_0,_0.1)] md:w-auto',
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
	const cohort = workshopNavigation?.cohorts[0]
	if (canView || !cohort) return null

	return (
		<Button
			size="lg"
			className={cn(
				'from-primary relative h-12 w-full rounded-lg bg-gradient-to-b to-indigo-800 text-sm font-semibold shadow-[0px_4px_38px_-14px_rgba(0,_0,_0,_0.1)] transition ease-out hover:brightness-110 md:w-auto',
				className,
				{
					'border-r text-white': !canView,
				},
			)}
			asChild
		>
			<Link prefetch href={`/cohorts/${cohort?.slug}`}>
				<span className="relative z-10 drop-shadow-md dark:text-white">
					Get Access
				</span>
				<div
					style={{
						backgroundSize: '200% 100%',
						animationDuration: '2s',
						animationIterationCount: 'infinite',
						animationTimingFunction: 'linear',
						animationFillMode: 'forwards',
						animationDelay: '2s',
					}}
					className="animate-shine absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0)40%,rgba(255,255,255,1)50%,rgba(255,255,255,0)60%)] opacity-10 dark:opacity-20"
				/>
			</Link>
		</Button>
	)
}

export function StartLearningWorkshopButtonSkeleton() {
	return (
		<Button
			size="lg"
			className="text-foreground/75 bg-card relative flex h-12 gap-2 rounded-lg border text-sm font-medium shadow-[0px_4px_38px_-14px_rgba(0,_0,_0,_0.1)] hover:bg-transparent"
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
		<div className="col-span-2 hidden items-center border-l pl-5 text-base font-medium md:flex">
			Content
		</div>
	)
}

export function WorkshopGitHubRepoLink({
	abilityLoader,
	githubUrl,
}: {
	abilityLoader: Promise<
		Omit<AbilityForResource, 'canView'> & {
			canViewWorkshop: boolean
			canViewLesson: boolean
			isPendingOpenAccess: boolean
		}
	>
	githubUrl?: string
}) {
	const { canViewWorkshop: canView } = React.use(abilityLoader)
	if (!githubUrl) return null
	if (!canView) return null
	return (
		<Button
			asChild
			size="lg"
			variant="ghost"
			className="hover:text-primary hover:bg-card-muted bg-card h-12 w-full rounded-lg border px-4 shadow-[0px_4px_38px_-14px_rgba(0,_0,_0,_0.1)] ease-out md:w-auto"
		>
			<Link href={githubUrl} target="_blank" rel="noopener noreferrer">
				<Github className="size-4" /> Workshop App
			</Link>
		</Button>
	)
}
