'use client'

import Link from 'next/link'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { ArrowRight } from 'lucide-react'

import { Button, Skeleton } from '@coursebuilder/ui'

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

	if (!post && status !== 'pending') return null

	return (
		<nav
			className={cn(
				'mt-8 flex w-full flex-col items-center rounded bg-gray-950 px-5 py-10 text-center',
				className,
			)}
			aria-label="Recommendations"
		>
			<h2 className="fluid-2xl mb-3 font-semibold">Recommended Next</h2>
			<ul className="w-full">
				<li className="flex w-full flex-col">
					<Button
						className="text-primary flex w-full items-center gap-2 text-lg lg:text-xl"
						asChild
						variant="link"
					>
						{status === 'pending' ? (
							<Skeleton className="mx-auto mt-2 flex h-8 w-full max-w-sm" />
						) : post ? (
							<Link href={`/${post.slug}`}>
								{post.title} <ArrowRight className="w-4" />
							</Link>
						) : null}
					</Button>
				</li>
			</ul>
		</nav>
	)
}
