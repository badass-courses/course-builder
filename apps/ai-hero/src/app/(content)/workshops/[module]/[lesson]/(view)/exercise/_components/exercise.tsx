'use client'

import React, { use } from 'react'
import Link from 'next/link'
import { Lesson } from '@/lib/lessons'
import pluralize from 'pluralize'

import { Button } from '@coursebuilder/ui'

export default function Exercise({
	lesson,
	moduleType = 'workshop',
	moduleSlug,
}: {
	lesson: Lesson | null
	moduleType?: string
	moduleSlug: string
}) {
	if (!lesson) {
		return null
	}

	const githubUrl = lesson.fields?.github
	const gitpodUrl = lesson.fields?.gitpod

	return (
		<div className="text-foreground bg-muted flex h-full w-full flex-col items-center justify-center py-8 text-center sm:aspect-video">
			<h2 className="text-xl font-bold">
				Now it&#8217;s your turn! Try solving this exercise.
			</h2>
			<div className="mt-8 flex flex-col gap-5 md:flex-row md:gap-2">
				{githubUrl && (
					<div className="flex flex-col items-center gap-3">
						<h3 className="font-semibold">Run locally (recommended)</h3>
						<Button variant="default" asChild className="gap-1">
							<Link href={githubUrl} target="_blank">
								<svg
									width={16}
									height={16}
									viewBox={'0 0 16 16'}
									aria-hidden="true"
									role={'img'}
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										fillRule="evenodd"
										clipRule="evenodd"
										fill="currentColor"
										d="M8,0.2c-4.4,0-8,3.6-8,8c0,3.5,2.3,6.5,5.5,7.6 C5.9,15.9,6,15.6,6,15.4c0-0.2,0-0.7,0-1.4C3.8,14.5,3.3,13,3.3,13c-0.4-0.9-0.9-1.2-0.9-1.2c-0.7-0.5,0.1-0.5,0.1-0.5 c0.8,0.1,1.2,0.8,1.2,0.8C4.4,13.4,5.6,13,6,12.8c0.1-0.5,0.3-0.9,0.5-1.1c-1.8-0.2-3.6-0.9-3.6-4c0-0.9,0.3-1.6,0.8-2.1 c-0.1-0.2-0.4-1,0.1-2.1c0,0,0.7-0.2,2.2,0.8c0.6-0.2,1.3-0.3,2-0.3c0.7,0,1.4,0.1,2,0.3c1.5-1,2.2-0.8,2.2-0.8 c0.4,1.1,0.2,1.9,0.1,2.1c0.5,0.6,0.8,1.3,0.8,2.1c0,3.1-1.9,3.7-3.7,3.9C9.7,12,10,12.5,10,13.2c0,1.1,0,1.9,0,2.2 c0,0.2,0.1,0.5,0.6,0.4c3.2-1.1,5.5-4.1,5.5-7.6C16,3.8,12.4,0.2,8,0.2z"
									/>
								</svg>
								Code
							</Link>
						</Button>
						<p className="text-muted-foreground max-w-sm text-balance text-sm italic">
							Start by cloning the project repository and follow instructions in
							the README.
						</p>
					</div>
				)}
				{gitpodUrl && (
					<div className="flex flex-col items-center gap-3">
						<h3 className="font-semibold">Or in browser</h3>
						<Button variant="outline" asChild className="gap-1">
							<Link href={gitpodUrl} target="_blank">
								<svg
									width={16}
									height={16}
									viewBox={'0 0 16 16'}
									aria-hidden="true"
									role={'img'}
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										fill="currentColor"
										d="M9.355.797a1.591 1.591 0 0 1-.58 2.156L4.122 5.647a.401.401 0 0 0-.2.348v4.228a.4.4 0 0 0 .2.347l3.683 2.133a.39.39 0 0 0 .39 0l3.685-2.133a.4.4 0 0 0 .2-.347v-2.63L8.766 9.485a1.55 1.55 0 0 1-2.127-.6 1.592 1.592 0 0 1 .593-2.153l4.739-2.708c1.443-.824 3.228.232 3.228 1.91v4.61a3.015 3.015 0 0 1-1.497 2.612l-4.23 2.448a2.937 2.937 0 0 1-2.948 0l-4.229-2.448A3.016 3.016 0 0 1 .8 10.544v-4.87A3.016 3.016 0 0 1 2.297 3.06L7.225.208a1.55 1.55 0 0 1 2.13.589Z"
									/>
								</svg>
								Open on Gitpod
							</Link>
						</Button>
					</div>
				)}
			</div>
			<div
				className="bg-border mt-10 h-px w-full max-w-md"
				aria-hidden="true"
			/>
			<Button asChild variant="secondary" className="mt-10">
				<Link
					href={`/${pluralize(moduleType)}/${moduleSlug}/${lesson?.fields?.slug}/solution`}
				>
					Continue
				</Link>
			</Button>
		</div>
	)
}
