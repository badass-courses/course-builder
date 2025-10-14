'use server'

import React, { use } from 'react'
import { cookies } from 'next/headers'
import Link from 'next/link'
import type { Lesson } from '@/lib/lessons'
import { getServerAuthSession } from '@/server/auth'
import { CK_SUBSCRIBER_KEY } from '@skillrecordings/config'
import { ArrowRight, Github } from 'lucide-react'

import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'
import type { AbilityForResource } from '@coursebuilder/utils-auth/current-ability-rules'

import { CopyProblemPromptButton } from '../workshops/_components/copy-problem-prompt-button'
import GetAccessButton from '../workshops/_components/get-access-button'
import { AutoPlayToggle } from './autoplay-toggle'
import { ModuleLessonProgressToggle } from './module-lesson-progress-toggle'

export const LessonControls = async ({
	lesson,
	problem,
	className,
	moduleType = 'workshop',
	abilityLoader,
	moduleSlug,
}: {
	lesson: Lesson | null
	problem?: Lesson | null
	className?: string
	moduleType?: 'tutorial' | 'workshop'
	moduleSlug: string
	abilityLoader: Promise<
		Omit<AbilityForResource, 'canView'> & {
			canViewWorkshop: boolean
			canViewLesson: boolean
			isPendingOpenAccess: boolean
		}
	>
}) => {
	const { session } = await getServerAuthSession()
	const cookieStore = await cookies()
	const ckSubscriber = cookieStore.has(CK_SUBSCRIBER_KEY)

	if (!lesson) {
		return null
	}
	const githubUrl = lesson.fields?.github || problem?.fields?.github

	const hasSolution = lesson.resources?.some(
		(resource) => resource.resource.type === 'solution',
	)

	const isProblemLesson = lesson.type === 'lesson' && hasSolution

	return (
		<div
			className={cn(
				'bg-card mb-8 flex h-10 w-full items-center justify-between border-b sm:h-12',
				className,
			)}
		>
			<div className="flex h-full grow items-center">
				<React.Suspense fallback={null}>
					<GetAccessButton
						className="border-r-border dark:bg-primary dark:hover:bg-primary/90 h-full rounded-none border-0 border-r bg-blue-600 px-5 text-sm hover:bg-blue-500"
						abilityLoader={abilityLoader}
						moduleSlug={moduleSlug}
					/>
				</React.Suspense>
				<React.Suspense fallback={null}>
					<CopyProblemPromptButton
						abilityLoader={abilityLoader}
						lesson={lesson}
						problem={problem}
						className="hover:bg-muted/50 border-r-border h-full rounded-none border-0 border-r bg-transparent px-3 text-sm"
					/>
				</React.Suspense>
				{githubUrl && (
					<Button
						asChild
						variant="outline"
						className="hover:bg-muted/50 border-r-border h-full rounded-none border-0 bg-transparent sm:border-r"
					>
						<Link href={githubUrl} target="_blank">
							<Github className="text-muted-foreground mr-2 h-4 w-4" />
							<span className="inline-block sm:hidden" aria-hidden="true">
								Code
							</span>
							<span className="hidden sm:inline-block">Source Code</span>
						</Link>
					</Button>
				)}
			</div>
			{isProblemLesson && (
				<Button
					asChild
					variant="outline"
					className="hover:bg-muted/50 border-l-border h-full rounded-none border-0 border-l bg-transparent"
				>
					<Link href={`${lesson.fields.slug}/solution`} prefetch>
						Solution
						<ArrowRight className="text-muted-foreground ml-2 h-4 w-4" />
					</Link>
				</Button>
			)}
			<React.Suspense fallback={null}>
				{(session?.user || ckSubscriber) &&
				((lesson.type === 'lesson' && !isProblemLesson) ||
					lesson.type === 'solution') ? (
					<ModuleLessonProgressToggle
						abilityLoader={abilityLoader}
						// if we are on solution, pass in exercise as lesson for completing
						lesson={lesson.type === 'solution' && problem ? problem : lesson}
						moduleType={moduleType}
						lessonType={
							lesson.type === 'solution' && problem ? 'solution' : lesson.type
						}
					/>
				) : null}
			</React.Suspense>
		</div>
	)
}
