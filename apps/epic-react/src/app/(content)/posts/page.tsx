import * as React from 'react'
import { Suspense } from 'react'
import Link from 'next/link'
import { CreatePost } from '@/app/(content)/posts/_components/create-post'
import { DeletePostButton } from '@/app/(content)/posts/_components/delete-post-button'
import { courseBuilderAdapter } from '@/db'
import { getKcdUserByEmail } from '@/lib/kcd-posts-query'
import {
	getAllPosts,
	getAllPostsForUser,
	getCachedAllPosts,
	getCachedAllPostsForUser,
} from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'
import { subject } from '@casl/ability'

import { ContentResource } from '@coursebuilder/core/schemas'
import { Badge, Button } from '@coursebuilder/ui'

export default async function PostsListPage() {
	return (
		<div className="container py-5 sm:py-14">
			<div className="flex grid-cols-12 flex-col gap-10 sm:grid">
				<div className="col-span-8">
					<h1 className="mb-5 w-full border-b pb-2 text-4xl font-bold">
						Posts
					</h1>
					<PostList />
				</div>
				<Suspense>
					<PostListActions />
				</Suspense>
			</div>
		</div>
	)
}

async function PostList() {
	const { ability, session } = await getServerAuthSession()

	let postsModule

	if (ability.can('manage', 'all')) {
		postsModule = await getAllPosts()
	} else {
		postsModule = await getAllPostsForUser(session?.user?.id)
	}

	return (
		<ul className="divide-y border-b">
			{postsModule.length > 0 ? (
				postsModule.map((post: ContentResource) => {
					return (
						<li
							key={post.id}
							className="flex w-full flex-col items-end justify-between gap-1 pb-2 sm:flex-row sm:items-center sm:gap-5 sm:pb-0"
						>
							<h2 className="flex w-full">
								<Link
									className="flex w-full py-2 text-lg font-bold hover:underline"
									href={`/${post?.fields?.slug || post.id}`}
								>
									{post?.fields?.title}
								</Link>
							</h2>
							<div className="flex items-center gap-2">
								<Badge variant="outline">{post.fields?.state}</Badge>
								{ability.can('manage', subject('Content', post)) && (
									<div className="flex gap-1">
										<Button size="sm" asChild>
											<Link href={`/posts/${post.id}/edit`}>Edit</Link>
										</Button>
										<DeletePostButton id={post.id} />
									</div>
								)}
							</div>
						</li>
					)
				})
			) : (
				<li className="flex w-full flex-col items-end justify-between gap-1 py-2 sm:flex-row sm:items-center sm:gap-5">
					No posts found. Create a post to get started
				</li>
			)}
		</ul>
	)
}

const InstructorByLine = async ({ userId }: { userId: string }) => {
	const user = await courseBuilderAdapter?.getUser?.(userId)
	const kcdUser = await getKcdUserByEmail(user?.email)
	return kcdUser ? (
		<div className="text-muted-foreground text-mono text-xs">
			{kcdUser.name}
		</div>
	) : null
}

async function PostListActions() {
	const { ability } = await getServerAuthSession()
	return (
		<>
			{ability.can('create', 'Content') ? (
				<div className="col-span-4 sm:mt-8">
					<h2 className="pb-2 text-3xl font-bold sm:text-2xl">
						Create New Post
					</h2>
					<CreatePost />
				</div>
			) : null}
		</>
	)
}
