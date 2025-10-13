'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { env } from '@/env.mjs'
import { setProgressForResource } from '@/lib/progress'
import { getAdjacentWorkshopResources } from '@/utils/get-adjacent-workshop-resources'
import { ArrowRight } from 'lucide-react'
import { useSession } from 'next-auth/react'

import { cn } from '@coursebuilder/ui/utils/cn'
import type { AbilityForResource } from '@coursebuilder/utils-auth/current-ability-rules'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

import { useModuleProgress } from '../../_components/module-progress-provider'
import { useWorkshopNavigation } from './workshop-navigation-provider'

// Component just for prefetching the next resource
function PrefetchNextResource({
	nextResource,
	workshopSlug,
}: {
	nextResource: { type: string; slug: string } | null
	workshopSlug: string | null
}) {
	const router = useRouter()

	React.useEffect(() => {
		if (!nextResource || !workshopSlug) return

		router.prefetch(
			getResourcePath(nextResource.type, nextResource.slug, 'view', {
				parentType: 'workshop',
				parentSlug: workshopSlug,
			}),
		)
	}, [router, nextResource, workshopSlug])

	return null
}

export default function UpNext({
	currentResourceId,
	className,
	abilityLoader,
}: {
	currentResourceId: string
	className?: string
	abilityLoader: Promise<
		Omit<AbilityForResource, 'canView'> & {
			canViewWorkshop: boolean
			canViewLesson: boolean
			isPendingOpenAccess: boolean
		}
	>
}) {
	const navigation = useWorkshopNavigation()
	const [isPending, startTransition] = React.useTransition()
	const { data: session } = useSession()
	const ability = React.use(abilityLoader)
	const canView = ability?.canViewLesson
	const { moduleProgress, addLessonProgress } = useModuleProgress()

	if (!navigation) {
		return null
	}

	const { nextResource } = getAdjacentWorkshopResources(
		navigation,
		currentResourceId,
	)

	// If there's no next resource, don't render anything
	if (!nextResource) {
		return null
	}

	// Helper function to find if current resource is a solution and get its parent lesson
	const findParentLessonForSolution = (resourceId: string) => {
		for (const resource of navigation.resources) {
			if (resource.type === 'lesson' && resource.resources) {
				const solutionResource = resource.resources.find(
					(r) => r.id === resourceId && r.type === 'solution',
				)
				if (solutionResource) {
					return resource
				}
			}
		}
		return null
	}

	// Helper function to check if a lesson has a solution
	const lessonHasSolution = (lessonId: string) => {
		const lesson = navigation.resources.find(
			(r) => r.id === lessonId && r.type === 'lesson',
		)
		return (
			lesson?.type === 'lesson' &&
			lesson.resources &&
			lesson.resources.length > 0 &&
			lesson.resources.some((r: any) => r.type === 'solution')
		)
	}

	// Determine what should be completed and if we should complete anything
	const getCompletionLogic = () => {
		const parentLesson = findParentLessonForSolution(currentResourceId)

		if (parentLesson) {
			// Current resource is a solution, complete the parent lesson
			return {
				shouldComplete: true,
				resourceToComplete: parentLesson.id,
				resourceSlugForRevalidation: parentLesson.slug,
			}
		}

		// Current resource is not a solution, check if it's a lesson
		const currentResource = navigation.resources.find(
			(r) => r.id === currentResourceId,
		)
		if (currentResource?.type === 'lesson') {
			if (lessonHasSolution(currentResourceId)) {
				// Lesson has a solution, don't complete it
				return {
					shouldComplete: false,
					resourceToComplete: null,
					resourceSlugForRevalidation: null,
				}
			} else {
				// Regular lesson without solution, complete normally
				return {
					shouldComplete: true,
					resourceToComplete: currentResourceId,
					resourceSlugForRevalidation: currentResource.slug,
				}
			}
		}

		// Fallback: don't complete
		return {
			shouldComplete: false,
			resourceToComplete: null,
			resourceSlugForRevalidation: null,
		}
	}

	const completionLogic = getCompletionLogic()

	// For solution resources, we need to use the parent lesson's slug
	const nextResourceSlug = nextResource.slug

	const isCompleted = Boolean(
		moduleProgress?.completedLessons?.some(
			(p) =>
				p.resourceId ===
					(completionLogic.resourceToComplete || currentResourceId) &&
				p.completedAt,
		),
	)

	const upNextText = lessonHasSolution(currentResourceId)
		? `View ${process.env.NEXT_PUBLIC_PARTNER_FIRST_NAME || 'Instructor'}'s Solution`
		: 'Up Next'

	return (
		<>
			<PrefetchNextResource
				nextResource={{
					type: nextResource.type,
					slug: nextResourceSlug,
				}}
				workshopSlug={navigation.slug}
			/>
			<nav
				className={cn(
					'bg-card mt-8 flex w-full flex-col items-center rounded border px-5 py-10 text-center',
					className,
				)}
				aria-label={upNextText}
			>
				<h2 className="mb-3 text-2xl font-semibold">{upNextText}:</h2>
				<ul className="w-full">
					<li className="flex w-full flex-col">
						<Link
							className="dark:text-primary flex w-full items-center justify-center gap-2 text-center text-lg text-orange-600 hover:underline lg:text-xl"
							href={getResourcePath(
								nextResource.type,
								nextResourceSlug,
								'view',
								{
									parentType: 'workshop',
									parentSlug: navigation.slug,
								},
							)}
							onClick={async () => {
								if (
									!isCompleted &&
									completionLogic.shouldComplete &&
									completionLogic.resourceToComplete &&
									canView
								) {
									startTransition(() => {
										addLessonProgress(completionLogic.resourceToComplete!)
									})
									await setProgressForResource({
										resourceId: completionLogic.resourceToComplete,
										isCompleted: true,
									})
								}
							}}
						>
							{nextResource.title}
							<ArrowRight className="hidden w-4 sm:block" />
						</Link>
						{!session?.user && (
							<span className="text-muted-foreground mt-4">
								<Link
									href="/login"
									target="_blank"
									className="hover:text-foreground text-center underline"
								>
									Log in
								</Link>{' '}
								to save progress
							</span>
						)}
					</li>
				</ul>
			</nav>
		</>
	)
}
