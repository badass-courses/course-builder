'use client'

import Link from 'next/link'
import { setProgressForResource } from '@/lib/progress'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { useSession } from 'next-auth/react'

import { Button, Skeleton } from '@coursebuilder/ui'

import { useProgress } from './progress-provider'

export default function Recommendations({
	postId,
	className,
}: {
	postId: string
	className?: string
}) {
	const { data: post, status } = api.typesense.getNearestNeighbor.useQuery(
		{
			documentId: postId,
		},
		{
			refetchOnWindowFocus: false,
			refetchOnMount: false,
		},
	)
	const { progress, addLessonProgress } = useProgress()
	const { data: session } = useSession()
	const isCompleted = progress?.completedLessons.some(
		(lesson) => lesson.resourceId === postId,
	)
	if (!post && status !== 'pending') return null

	return (
		<nav
			className={cn(
				'flex w-full flex-col items-center border-t px-5 py-16 text-center',
				className,
			)}
			aria-label="Recommendations"
		>
			<h2 className="fluid-2xl mb-3 font-semibold">Up Next</h2>
			<ul className="w-full">
				<li className="flex w-full flex-col">
					{status === 'pending' ? (
						<Skeleton className="mx-auto mt-2 flex h-20 w-full max-w-sm sm:h-[49px]" />
					) : post ? (
						<Link
							className="text-primary lg:fluid-lg flex w-full items-center justify-center gap-2 py-4 text-center text-lg font-medium hover:underline"
							href={`/${post.slug}`}
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
							{post.title}{' '}
							<ChevronRight className="hidden size-4 sm:block sm:size-5" />
						</Link>
					) : null}
					{!session?.user && (
						<span className="text-muted-foreground mt-4">
							<Link
								href="/login"
								target="_blank"
								className="text-primary text-center hover:underline"
							>
								Sign in
							</Link>{' '}
							to save your progress
						</span>
					)}
				</li>
			</ul>
		</nav>
	)
}
