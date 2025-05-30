import * as React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Post } from '@/lib/posts'
import { getAllPosts } from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { FileText } from 'lucide-react'

import CreatePostModalClient from './_components/modal-client'

export default async function PagesIndexPage() {
	const { ability } = await getServerAuthSession()
	if (ability.cannot('manage', 'all')) {
		notFound()
	}

	const allPosts = await getAllPosts()

	return (
		<main className="flex w-full justify-between p-10">
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
				<div className="mb-5 flex w-full items-center justify-between">
					<h1 className="fluid-3xl font-heading font-bold">Posts</h1>

					<CreatePostModalClient />
				</div>
				<ul className="divide-border flex flex-col divide-y">
					{allPosts.map((post, i) => {
						return (
							<PostTeaser
								i={i}
								article={post}
								key={post.id}
								className="flex w-full items-center py-4"
							/>
						)
					})}
				</ul>
			</div>
		</main>
	)
}

const PostTeaser: React.FC<{
	article: Post
	i?: number
	className?: string
}> = ({ article, className, i }) => {
	const title = article.fields.title

	return (
		<li className={cn('', className)}>
			<Link
				href={`/admin/posts/${article.fields.slug}/edit`}
				passHref
				className="fluid-lg flex w-full items-center gap-3 py-5"
			>
				<FileText className="text-muted-foreground h-4 w-4" /> {title}
			</Link>
		</li>
	)
}
