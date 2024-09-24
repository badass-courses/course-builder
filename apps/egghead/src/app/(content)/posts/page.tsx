import * as React from 'react'
import { Suspense } from 'react'
import Link from 'next/link'
import { CreatePost } from '@/app/(content)/posts/_components/create-post'
import { DeletePostButton } from '@/app/(content)/posts/_components/delete-post-button'
import { getCachedAllPosts, getCachedAllPostsForUser } from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'
import { subject } from '@casl/ability'

import { ContentResource } from '@coursebuilder/core/schemas'
import {
	Button,
	Card,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

export default async function PostsListPage() {
	return (
		<div className="bg-muted flex h-full flex-grow flex-col-reverse gap-3 p-5 md:flex-row">
			<div className="flex flex-grow flex-col space-y-2 md:order-2">
				<h2 className="text-lg font-bold">Posts</h2>
				<PostList />
			</div>
			<Suspense>
				<PostListActions />
			</Suspense>
		</div>
	)
}

async function PostList() {
	const { ability, session } = await getServerAuthSession()

	let postsModule

	if (ability.can('manage', 'all')) {
		postsModule = await getCachedAllPosts()
	} else {
		postsModule = await getCachedAllPostsForUser({ userId: session?.user?.id })
	}
	return (
		<>
			{postsModule.length > 0 ? (
				postsModule.map((post: ContentResource) => {
					return (
						<Card key={post.id}>
							<CardHeader>
								<div className="text-muted-foreground text-mono text-xs">
									{post.fields?.state}
								</div>
								<CardTitle>
									{/* posts are presented at the root of the site and not in a sub-route */}
									<Link
										className="w-full"
										href={`/${post?.fields?.slug || post.id}`}
									>
										{post?.fields?.title}
									</Link>
								</CardTitle>
							</CardHeader>
							{ability.can('manage', subject('Content', post)) && (
								<CardFooter>
									<div className="flex w-full justify-end gap-2">
										<Button size="sm">
											<Link href={`/posts/${post.id}/edit`}>Edit</Link>
										</Button>
										<DeletePostButton id={post.id} />
									</div>
								</CardFooter>
							)}
						</Card>
					)
				})
			) : (
				<div className="text-muted-foreground flex h-full justify-center">
					No posts found. Create a post to get started
				</div>
			)}
		</>
	)
}

async function PostListActions() {
	const { ability } = await getServerAuthSession()
	return (
		<>
			{ability.can('create', 'Content') ? (
				<div className="order-1 h-full flex-grow md:order-2">
					<h1 className="pb-2 text-lg font-bold">Create Post</h1>
					<CreatePost />
				</div>
			) : null}
		</>
	)
}
