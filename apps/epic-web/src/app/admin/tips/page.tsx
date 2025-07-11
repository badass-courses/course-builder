import * as React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Post } from '@/lib/posts'
import { getAllTips } from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { Lightbulb } from 'lucide-react'

import { CreatePostModal } from '../../posts/_components/create-post-modal'

/**
 * Admin page for managing tips.
 * Requires 'manage all' permissions to access.
 */
export default async function TipsIndexPage() {
	const { ability } = await getServerAuthSession()
	if (ability.cannot('manage', 'all')) {
		notFound()
	}
	const allTips = await getAllTips()

	return (
		<main className="flex w-full justify-between p-10">
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
				<div className="mb-5 flex w-full items-center justify-between">
					<h1 className="fluid-3xl font-heading font-bold">Tips</h1>

					<CreatePostModal
						availableResourceTypes={['tip']}
						defaultResourceType="tip"
						topLevelResourceTypes={['post']}
					/>
				</div>
				<ul className="divide-border flex flex-col divide-y">
					{allTips.map((tip, i) => {
						return (
							<TipTeaser
								i={i}
								tip={tip}
								key={tip.id}
								className="flex w-full items-center py-4"
							/>
						)
					})}
				</ul>
			</div>
		</main>
	)
}

/**
 * Displays a single tip entry inside the Tips admin list.
 *
 * @param tip - The tip resource to display.
 * @param i - Optional index of the tip in the list (unused currently, but handy for future needs).
 * @param className - Optional additional CSS classes to apply to the list item element.
 */
const TipTeaser: React.FC<{
	tip: Post
	i?: number
	className?: string
}> = ({ tip, className, i }) => {
	const title = tip.fields.title

	return (
		<li className={cn('', className)}>
			<Link
				href={`/posts/${tip.fields.slug}/edit`}
				passHref
				className="fluid-lg flex w-full items-center gap-3 py-5"
			>
				<Lightbulb className="text-muted-foreground h-4 w-4" /> {title}
			</Link>
		</li>
	)
}
