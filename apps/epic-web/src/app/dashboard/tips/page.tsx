import * as React from 'react'
import { revalidateTag } from 'next/cache'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Post } from '@/lib/posts'
import { getAllTipsForUser } from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { Lightbulb } from 'lucide-react'

import { CreatePostModal } from '../../posts/_components/create-post-modal'

/**
 * Page for a contributor to see and manage their tips.
 */
export default async function ContributorTipsPage() {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user) {
		redirect('/login')
	}

	const tips = await getAllTipsForUser(user.id)

	return (
		<main className="flex w-full justify-between p-10">
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
				<div className="mb-5 flex w-full items-center justify-between">
					<h1 className="fluid-3xl font-heading font-bold">Your Tips</h1>
					{ability.can('create', 'Content') && (
						<CreatePostModal
							availableResourceTypes={['tip', 'post']}
							defaultResourceType="tip"
						/>
					)}
				</div>
				<ul className="divide-border flex flex-col divide-y">
					{tips.map((tip) => {
						return <TipTeaser tip={tip} key={tip.id} />
					})}
				</ul>
			</div>
		</main>
	)
}

/**
 * Renders a teaser for a tip with a link to its edit page
 * @param tip - The tip to display
 * @param className - Optional CSS class name for styling
 */
const TipTeaser: React.FC<{
	tip: Post
	className?: string
}> = ({ tip, className }) => {
	const title = tip.fields.title

	return (
		<li className={cn('flex w-full items-center py-4', className)}>
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
