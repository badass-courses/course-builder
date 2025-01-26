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
				'mt-8 flex w-full flex-col items-center rounded bg-gray-950 px-5 py-10 text-center',
				className,
			)}
			aria-label="Recommendations"
		>
			<h2 className="fluid-2xl mb-3 font-semibold">Up Next</h2>
			<ul className="w-full">
				<li className="flex w-full flex-col">
					{status === 'pending' ? (
						<Skeleton className="mx-auto mt-2 flex h-8 w-full max-w-sm" />
					) : post ? (
						<Button
							className="text-primary flex w-full items-center gap-2 text-lg lg:text-xl"
							asChild
							variant="link"
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
							<Link href={`/${post.slug}`}>
								{post.title} <ArrowRight className="w-4" />
							</Link>
						</Button>
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
