'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

export default function PostNextUpFromListPagination({
	postId,
	className,
}: {
	postId: string
	className?: string
}) {
	const { list } = useList()
	const router = useRouter()
	const nextUp = list && getNextUpResourceFromList(list, postId)
	const { progress, addLessonProgress } = useProgress()
	const isCompleted = progress?.completedLessons.some(
		(lesson) => lesson.resourceId === postId,
	)
	const { data: session } = useSession()

	React.useEffect(() => {
		if (nextUp) {
			router.prefetch(
				`/${nextUp.resource.fields?.slug}${list ? `?list=${list.fields.slug}` : ''}`,
			)
		}
	}, [nextUp, list, router])

	if (!list) return <Recommendations postId={postId} className={className} />

	return nextUp?.resource && nextUp?.resource?.fields?.state === 'published' ? (
		<nav
			className={cn(
				'bg-card mt-8 flex w-full flex-col items-center rounded border px-5 py-10 text-center',
				className,
			)}
			aria-label="List navigation"
		>
			<h2 className="fluid-2xl mb-3 font-semibold">Continue</h2>
			<ul>
				<li className="flex flex-col">
					<Button
						className="dark:text-primary flex w-full items-center gap-2 text-lg text-orange-600 lg:text-xl"
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
						<Link
							href={`/${nextUp.resource.fields?.slug}${list ? `?list=${list.fields.slug}` : ''}`}
						>
							{nextUp.resource.fields?.title} <ArrowRight className="w-4" />
						</Link>
					</Button>
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
