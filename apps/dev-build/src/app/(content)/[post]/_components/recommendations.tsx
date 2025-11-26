'use client'

import Link from 'next/link'
import { setProgressForResource } from '@/lib/progress'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { ArrowRight } from 'lucide-react'
import { useSession } from 'next-auth/react'

import { Button, Skeleton } from '@coursebuilder/ui'

import { useProgress } from './progress-provider'

export default function Recommendations({
	postId,
	className,
	documentIdsToSkip,
}: {
	postId: string
	className?: string
	documentIdsToSkip?: string[]
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

	if ((!post && status !== 'pending') || error) return null

	return (
		<nav
			className={cn(
				'bg-card ring-border group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-lg px-5 py-16 text-center shadow-md ring-1',
				className,
			)}
			aria-label="Recommendations"
		>
			<h2 className="mb-3 text-xl font-bold tracking-tight sm:text-2xl">
				Recommended next
			</h2>
			<ul className="w-full">
				<li className="flex w-full flex-col">
					{status === 'pending' ? (
						<Skeleton className="mx-auto mt-2 flex h-8 w-full max-w-sm" />
					) : post ? (
						<Link
							href={`/${post.slug}`}
							className="dark:text-primary flex w-full items-center justify-center gap-2 text-center text-lg font-medium text-orange-600 hover:underline lg:text-xl"
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
