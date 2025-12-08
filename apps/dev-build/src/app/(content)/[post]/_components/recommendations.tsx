'use client'

import * as React from 'react'
import Link from 'next/link'
import { setProgressForResource } from '@/lib/progress'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { ArrowRight } from 'lucide-react'
import { useSession } from 'next-auth/react'

import { Button, Skeleton } from '@coursebuilder/ui'

import { useProgress } from './progress-provider'

/**
 * Displays AI-recommended next content based on similarity search.
 * Supports exposing the resolved next URL for auto-continue functionality.
 */
export default function Recommendations({
	postId,
	className,
	documentIdsToSkip,
	onNextUrlResolved,
}: {
	postId: string
	className?: string
	documentIdsToSkip?: string[]
	/** Called when the recommended URL is resolved */
	onNextUrlResolved?: (url: string | null) => void
}) {
	const {
		data: post,
		status,
		error,
	} = api.typesense.getNearestNeighbor.useQuery(
		{
			documentId: postId,
			documentIdsToSkip,
		},
		{
			refetchOnWindowFocus: false,
			retry: false,
		},
	)
	const { progress, addLessonProgress } = useProgress()
	const { data: session } = useSession()
	const isCompleted = progress?.completedLessons.some(
		(lesson) => lesson.resourceId === postId,
	)

	const nextUrl = post?.slug ? `/${post.slug}` : null

	React.useEffect(() => {
		onNextUrlResolved?.(nextUrl)
	}, [nextUrl, onNextUrlResolved])

	if ((!post && status !== 'pending') || error) return null

	return (
		<nav
			className={cn(
				'group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-lg px-8 py-16 text-center',
				className,
			)}
			aria-label="Recommendations"
		>
			<h2 className="mb-4 text-lg font-semibold tracking-tight sm:text-2xl">
				Recommended next
			</h2>
			<ul className="w-full">
				<li className="flex w-full flex-col">
					{status === 'pending' ? (
						<Skeleton className="mx-auto flex h-7 w-full max-w-sm" />
					) : post ? (
						<Link
							href={`/${post.slug}`}
							className="text-primary-dark flex w-full items-center justify-center gap-2 text-balance text-center text-lg font-medium underline underline-offset-2 hover:underline lg:text-xl"
						>
							{post.title} <ArrowRight className="hidden w-4 sm:block" />
						</Link>
					) : null}
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
	)
}
