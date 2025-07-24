import * as React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Post } from '@/lib/posts'
import { getAllPosts } from '@/lib/posts-query'
import { getImpersonatedSession } from '@/server/auth'
import { log } from '@/server/logger'
import { cn } from '@/utils/cn'
import { FileText } from 'lucide-react'

import { Alert, AlertDescription } from '@coursebuilder/ui'

import CreatePostModalClient from './_components/modal-client'

export default async function PagesIndexPage() {
	const { ability } = await getImpersonatedSession()
	if (ability.cannot('manage', 'all')) {
		notFound()
	}

	let allPosts: Post[] = []
	let postsError = false

	// Handle posts retrieval with error handling
	try {
		allPosts = await getAllPosts()
	} catch (error) {
		log.error('Failed to retrieve posts list', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		})
		postsError = true
	}

	return (
		<main className="flex w-full justify-between p-10">
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
				<div className="mb-5 flex w-full items-center justify-between">
					<h1 className="fluid-3xl font-heading font-bold">Posts</h1>

					<CreatePostModalClient />
				</div>

				{postsError ? (
					<Alert className="border-red-200 bg-red-50">
						<AlertDescription className="text-red-800">
							Failed to load posts. Please try refreshing the page or contact
							support if the problem persists.
						</AlertDescription>
					</Alert>
				) : allPosts.length === 0 ? (
					<div className="text-muted-foreground flex items-center justify-center py-8">
						<p>No posts found. Create your first post to get started.</p>
					</div>
				) : (
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
				)}
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
				href={`/posts/${article.fields.slug}/edit`}
				passHref
				className="fluid-lg flex w-full items-center gap-3 py-5"
			>
				<FileText className="text-muted-foreground h-4 w-4" /> {title}
			</Link>
		</li>
	)
}
