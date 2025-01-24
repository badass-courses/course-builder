'use client'

import Link from 'next/link'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { ArrowRight } from 'lucide-react'

import { Button } from '@coursebuilder/ui'

export default function Recommendations({
	postId,
	className,
}: {
	postId: string
	className?: string
}) {
	const { data: post, status } = api.typesense.getNearestNeighbor.useQuery({
		documentId: postId,
	})

	if (status === 'pending') return null
	if (!post) return null

	return (
		<nav
			className={cn(
				'mt-8 flex w-full flex-col items-center rounded bg-gray-950 px-5 py-10 text-center',
				className,
			)}
			aria-label="Recommendations"
		>
			<h2 className="fluid-2xl mb-3 font-semibold">Recommended Next</h2>
			<ul>
				<li className="flex flex-col">
					<Button
						className="text-primary inline-flex items-center gap-2 text-lg lg:text-xl"
						asChild
						variant="link"
					>
						<Link href={`/${post.slug}`}>
							{post.title} <ArrowRight className="w-4" />
						</Link>
					</Button>
				</li>
			</ul>
		</nav>
	)
}
