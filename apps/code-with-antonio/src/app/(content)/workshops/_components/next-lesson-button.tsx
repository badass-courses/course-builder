'use client'

import * as React from 'react'
import Link from 'next/link'
import { useModuleProgress } from '@/app/(content)/_components/module-progress-provider'
import { useWorkshopNavigation } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import Spinner from '@/components/spinner'
import { getFirstLessonSlug } from '@/lib/workshops'
import pluralize from 'pluralize'

import { Button } from '@coursebuilder/ui'

export function NextLessonButton({
	moduleType,
	moduleSlug,
}: {
	moduleType: string
	moduleSlug: string
}) {
	const workshopNavigation = useWorkshopNavigation()
	const firstLessonSlug = getFirstLessonSlug(workshopNavigation)
	const { moduleProgress } = useModuleProgress()
	return (
		<>
			{moduleProgress && (
				<>
					{moduleProgress?.nextResource?.fields?.slug &&
					moduleProgress?.completedLessons?.length > 0 ? (
						moduleProgress?.nextResource?.fields?.slug && (
							<Button
								asChild
								size="lg"
								className="mt-10 w-full min-w-48 md:w-auto"
							>
								<Link
									href={`/${pluralize(moduleType)}/${moduleSlug}/${moduleProgress?.nextResource?.fields.slug}`}
								>
									Continue Watching
								</Link>
							</Button>
						)
					) : (
						<>
							{firstLessonSlug && (
								<Button
									asChild
									size="lg"
									className="mt-10 w-full min-w-48 md:w-auto"
								>
									<Link
										href={`/${pluralize(moduleType)}/${moduleSlug}/${firstLessonSlug}`}
									>
										Start Learning
									</Link>
								</Button>
							)}
						</>
					)}
				</>
			)}
			{!moduleProgress && (
				<Button size="lg" disabled className="mt-10 w-full min-w-48 md:w-auto">
					<Spinner className="h-4 w-4" />
				</Button>
			)}
		</>
	)
}
