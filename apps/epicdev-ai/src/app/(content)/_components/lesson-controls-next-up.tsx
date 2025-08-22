'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Lesson } from '@/lib/lessons'
import { getAdjacentWorkshopResources } from '@/utils/get-adjacent-workshop-resources'
import { ArrowRight, ChevronRight } from 'lucide-react'

import { Button } from '@coursebuilder/ui'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

import { useWorkshopNavigation } from '../workshops/_components/workshop-navigation-provider'

const LessonControlsNextUp = ({ currentLesson }: { currentLesson: Lesson }) => {
	const navigation = useWorkshopNavigation()
	const pathname = usePathname()

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

	if (!navigation) return null

	const { nextResource, isExerciseNext, isSolutionNext } =
		getAdjacentWorkshopResources(
			navigation,
			currentLesson.id,
			getCurrentContext(),
		)

	if (!nextResource) return null

	return (
		<>
			{isSolutionNext && (
				<Button
					asChild
					variant="outline"
					className="hover:bg-muted/50 border-l-border h-full rounded-none border-0 border-l bg-transparent"
				>
					<Link
						href={getResourcePath(
							'solution',
							currentLesson.fields.slug,
							'view',
							{
								parentType: 'workshop',
								parentSlug: navigation.slug,
							},
						)}
						prefetch
					>
						Solution
						<ChevronRight className="text-muted-foreground h-4 w-4" />
					</Link>
				</Button>
			)}
			{isExerciseNext && (
				<Button
					asChild
					variant="outline"
					className="hover:bg-muted/50 border-l-border h-full rounded-none border-0 border-l bg-transparent"
				>
					<Link
						href={getResourcePath(
							'exercise',
							currentLesson.fields.slug,
							'view',
							{
								parentType: 'workshop',
								parentSlug: navigation.slug,
							},
						)}
						prefetch
					>
						Exercise
						<ChevronRight className="text-muted-foreground h-4 w-4" />
					</Link>
				</Button>
			)}
		</>
	)
}

export default LessonControlsNextUp
