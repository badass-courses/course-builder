import * as React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Post } from '@/lib/posts'
import { getAllPostsForUser } from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { FileText } from 'lucide-react'

import { CreatePostModal } from '../../posts/_components/create-post-modal'

/**
 * Page for a contributor to see and manage their posts.
 */
export default async function ContributorPostsPage() {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user) {
		redirect('/login')
	}

	const posts = await getAllPostsForUser(user.id)

	return (
		<main className="flex w-full justify-between p-10">
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
				<div className="mb-5 flex w-full items-center justify-between">
					<h1 className="fluid-3xl font-heading font-bold">Your Posts</h1>
					{ability.can('create', 'Content') && (
						<CreatePostModal
							availableResourceTypes={['post', 'tip']}
							defaultResourceType="post"
						/>
					)}
				</div>
				<ul className="divide-border flex flex-col divide-y">
					{posts.map((post) => {
						return <PostTeaser article={post} key={post.id} />
					})}
				</ul>
			</div>
		</main>
	)
}

const PostTeaser: React.FC<{
	article: Post
	className?: string
}> = ({ article, className }) => {
	const title = article.fields.title

	return (
		<li className={cn('flex w-full items-center py-4', className)}>
			<Link
				href={`/posts/${article.fields.slug}/edit`}
				passHref
				className="fluid-lg flex w-full items-center gap-3 py-5"
			>
				<FileText className="text-muted-foreground h-4 w-4" /> {title}
			</Link>
		</li>
	)
}
