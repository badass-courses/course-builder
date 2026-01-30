'use client'

import * as React from 'react'
import Link from 'next/link'
import { setProgressForResource } from '@/lib/progress'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
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
				className="mb-6 text-lg tracking-tight sm:text-xl"
			>
				Read next
			</motion.h2>
			<ul className="w-full">
				<li className="flex w-full flex-col">
					{status === 'pending' ? (
						<Skeleton className="bg-background/10 mx-auto flex h-9 w-full max-w-sm" />
					) : post ? (
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
								href={`/${post.slug}`}
								className="font-heading flex w-full items-center justify-center gap-2 text-balance text-center text-2xl font-semibold underline-offset-2 hover:underline lg:text-3xl"
							>
								{post.title}{' '}
							</Link>
						</motion.div>
					) : null}
					{!session?.user ? (
						<motion.span
							className="mt-6 text-base opacity-90"
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
	)
}
