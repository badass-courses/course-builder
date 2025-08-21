'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
	nextResourceUrl,
}: {
	nextResourceUrl: string | null
}) {
	const router = useRouter()

	React.useEffect(() => {
		if (!nextResourceUrl) return
		router.prefetch(nextResourceUrl)
	}, [router, nextResourceUrl])

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
	const pathname = usePathname()
	const [isPending, startTransition] = React.useTransition()
	const { data: session } = useSession()
	const ability = React.use(abilityLoader)
	const canView = ability?.canViewLesson
	const { moduleProgress, addLessonProgress } = useModuleProgress()

	// Determine current context from URL
	const getCurrentContext = () => {
		if (pathname.endsWith('/exercise')) {
			return 'exercise'
		} else if (pathname.endsWith('/solution')) {
			return 'solution'
		} else {
			return 'lesson' // or could be 'post', but for completion logic, treat as lesson
		}
	}

	const currentContext = getCurrentContext()

	if (!navigation) {
		return null
	}

	const { nextResource, isExerciseNext, isSolutionNext } =
		getAdjacentWorkshopResources(navigation, currentResourceId, currentContext)

	// If there's no next resource, don't render anything
	if (!nextResource) {
		return null
	}

	// Determine what should be completed and if we should complete anything
	const getCompletionLogic = () => {
		const currentResource = findCurrentResource(currentResourceId)

		if (currentContext === 'solution') {
			// We're on a solution page - complete the lesson
			return {
				shouldComplete: true,
				resourceToComplete: currentResourceId, // The lesson ID
				resourceSlugForRevalidation: currentResource?.slug || null,
			}
		} else if (currentContext === 'exercise') {
			// We're on an exercise page - don't complete yet, solution comes next
			return {
				shouldComplete: false,
				resourceToComplete: null,
				resourceSlugForRevalidation: null,
			}
		} else if (currentContext === 'lesson') {
			// We're on a lesson page - only complete if no exercises or solutions follow
			if (isExerciseNext || isSolutionNext) {
				// Lesson has next steps, don't complete it yet
				return {
					shouldComplete: false,
					resourceToComplete: null,
					resourceSlugForRevalidation: null,
				}
			} else {
				// Regular lesson without next steps, complete normally
				return {
					shouldComplete: true,
					resourceToComplete: currentResourceId,
					resourceSlugForRevalidation: currentResource?.slug || null,
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

	// Helper to find current resource
	const findCurrentResource = (resourceId: string) => {
		for (const resource of navigation.resources) {
			if (resource.id === resourceId) {
				return resource
			}
			if (resource.type === 'section') {
				const sectionResource = resource.resources.find(
					(r) => r.id === resourceId,
				)
				if (sectionResource) {
					return sectionResource
				}
			}
		}
		return null
	}

	const completionLogic = getCompletionLogic()

	const isCompleted = Boolean(
		moduleProgress?.completedLessons?.some(
			(p) =>
				p.resourceId ===
					(completionLogic.resourceToComplete || currentResourceId) &&
				p.completedAt,
		),
	)

	// Determine the "Up Next" text based on what's next
	const upNextText = isExerciseNext
		? 'Continue to Exercise'
		: isSolutionNext
			? "View Kent's Solution"
			: 'Up Next'

	// Generate the URL using the resource info from getAdjacentWorkshopResources
	const nextUrl = getResourcePath(
		nextResource.type,
		nextResource.slug,
		'view',
		{
			parentType: 'workshop',
			parentSlug: navigation.slug,
		},
	)

	return (
		<>
			<PrefetchNextResource nextResourceUrl={nextUrl} />
			<nav
				className={cn(
					'bg-card mt-8 flex w-full flex-col items-center rounded border px-5 py-10 text-center',
					className,
				)}
				aria-label={upNextText}
			>
				<h2 className="fluid-xl mb-3 font-semibold">{upNextText}:</h2>
				<ul className="w-full">
					<li className="flex w-full flex-col">
						<Link
							className="dark:text-primary text-primary flex w-full items-center justify-center gap-2 text-center text-lg hover:underline lg:text-xl"
							href={nextUrl}
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
