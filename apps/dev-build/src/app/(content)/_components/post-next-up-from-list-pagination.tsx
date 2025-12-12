'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { setProgressForResource } from '@/lib/progress'
import { cn } from '@/utils/cn'
import { getNextUpResourceFromList } from '@/utils/get-nextup-resource-from-list'
import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { useSession } from 'next-auth/react'

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
				'group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-lg px-8 py-16 text-center',
				className,
			)}
			aria-label="List navigation"
		>
			<motion.h2
				whileInView={{
					opacity: [0, 1],
					y: [10, 0],
					filter: ['blur(4px)', 'blur(0px)'],
				}}
				transition={{
					duration: 0.6,
					ease: [0.21, 0.47, 0.32, 0.98],
				}}
				className="tracking-relaxed mb-6 font-mono text-sm font-semibold uppercase opacity-90 sm:text-base"
			>
				Continue
			</motion.h2>
			<ul className="w-full">
				<li className="flex w-full flex-col">
					<motion.div
						whileInView={{
							opacity: [0, 1],
							y: [10, 0],
							filter: ['blur(4px)', 'blur(0px)'],
						}}
						transition={{
							duration: 0.6,
							delay: 0.2,
							ease: [0.21, 0.47, 0.32, 0.98],
						}}
					>
						<Link
							href={`/${nextUp.resource.fields?.slug}`}
							className="text-primary-dark flex w-full items-center justify-center gap-2 text-balance text-center text-lg font-semibold underline-offset-2 hover:underline lg:text-xl"
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
							<ArrowRight strokeWidth={3} className="hidden size-5 sm:block" />
						</Link>
					</motion.div>
					{!session?.user ? (
						<motion.span
							className="text-muted-foreground mt-6 text-base opacity-90"
							whileInView={{
								opacity: [0, 1],
								y: [10, 0],
								filter: ['blur(4px)', 'blur(0px)'],
							}}
							transition={{
								duration: 0.6,
								delay: 0.4,
								ease: [0.21, 0.47, 0.32, 0.98],
							}}
						>
							<Link
								href="/login"
								target="_blank"
								className="hover:text-foreground text-center underline"
							>
								Login
							</Link>{' '}
							to save progress.
						</motion.span>
					) : (
						<div className="mt-6 block h-6" />
					)}
				</li>
			</ul>
		</nav>
	) : null
}
