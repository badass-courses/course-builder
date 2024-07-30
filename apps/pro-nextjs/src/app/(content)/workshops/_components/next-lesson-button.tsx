'use client'

import * as React from 'react'
import Link from 'next/link'
import Spinner from '@/components/spinner'
import { api } from '@/trpc/react'
import pluralize from 'pluralize'

import { Button } from '@coursebuilder/ui'

export function NextLessonButton({
	moduleType,
	moduleSlug,
	firstLessonSlug,
}: {
	moduleType: string
	moduleSlug: string
	firstLessonSlug?: string | null
}) {
	const { data: moduleProgress, status } =
		api.progress.getModuleProgressForUser.useQuery({
			moduleId: moduleSlug,
		})

	return (
		<>
			{status === 'success' && (
				<>
					{moduleProgress?.nextResource?.fields?.slug ? (
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
										Start Watching
									</Link>
								</Button>
							)}
						</>
					)}
				</>
			)}
			{status === 'pending' && (
				<Button size="lg" className="mt-10 w-full min-w-48 md:w-auto">
					<Spinner />
				</Button>
			)}
		</>
	)
}
