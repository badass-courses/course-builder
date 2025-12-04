'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { type List } from '@/lib/lists'
import { setProgressForResource } from '@/lib/progress'
import { cn } from '@/utils/cn'
import { getNextUpResourceFromList } from '@/utils/get-nextup-resource-from-list'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { useSession } from 'next-auth/react'

import { Button } from '@coursebuilder/ui'

import { useList } from '../[post]/_components/list-provider'
import { useProgress } from '../[post]/_components/progress-provider'
import Recommendations from '../[post]/_components/recommendations'

/**
 * Displays navigation to the next resource in a list, or falls back to AI recommendations.
 * Supports exposing the resolved next URL for auto-continue functionality.
 */
export default function PostNextUpFromListPagination({
	postId,
	className,
	documentIdsToSkip,
	onNextUrlResolved,
}: {
	postId: string
	className?: string
	documentIdsToSkip?: string[]
	/** Called when the next URL is resolved (from list or recommendations) */
	onNextUrlResolved?: (url: string | null) => void
}) {
	const router = useRouter()
	const { list } = useList()
	const nextUp = list && getNextUpResourceFromList(list, postId)
	const { progress, addLessonProgress } = useProgress()
	const isCompleted = progress?.completedLessons.some(
		(lesson) => lesson.resourceId === postId,
	)
	const { data: session } = useSession()

	const nextUrl = nextUp?.resource?.fields?.slug
		? `/${nextUp.resource.fields.slug}`
		: null

	React.useEffect(() => {
		if (nextUp) {
			router.prefetch(`/${nextUp.resource.fields?.slug}`)
		}
	}, [nextUp, list, router])

	React.useEffect(() => {
		if (nextUrl) {
			onNextUrlResolved?.(nextUrl)
		}
	}, [nextUrl, onNextUrlResolved])

	if (!nextUp)
		return (
			<Recommendations
				postId={postId}
				className={className}
				documentIdsToSkip={documentIdsToSkip}
				onNextUrlResolved={onNextUrlResolved}
			/>
		)

	return nextUp?.resource && nextUp?.resource?.fields?.state === 'published' ? (
		<nav
			className={cn(
				'bg-card ring-border flex w-full flex-col items-center rounded-lg px-5 py-16 text-center shadow ring-1',
				className,
			)}
			aria-label="List navigation"
		>
			<h2 className="mb-3 text-xl font-semibold sm:text-3xl">Continue</h2>
			<ul>
				<li className="flex flex-col">
					<Link
						href={`/${nextUp.resource.fields?.slug}`}
						className="dark:text-primary flex w-full items-center gap-2 text-balance text-lg text-orange-600 hover:underline lg:text-xl"
						onClick={async () => {
							if (!isCompleted) {
								addLessonProgress(postId)
								await setProgressForResource({
									resourceId: postId,
									isCompleted: true,
								})
							}
						}}
					>
						{nextUp.resource.fields?.title}{' '}
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
	) : null
}
