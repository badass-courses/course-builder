import * as React from 'react'
import { Suspense } from 'react'
import Link from 'next/link'
import { CreatePost } from '@/app/(content)/posts/_components/create-post'
import { DeletePostButton } from '@/app/(content)/posts/_components/delete-post-button'
import { getCachedAllPosts } from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'

import { Card, CardFooter, CardHeader, CardTitle } from '@coursebuilder/ui'

export default async function PostsListPage() {
	return (
		<div className="bg-muted flex h-full flex-grow flex-col-reverse gap-3 p-5 md:flex-row">
			<div className="flex h-full flex-grow flex-col space-y-2 md:order-2">
				<h2 className="text-lg font-bold">Published Posts</h2>
				<PostList />
			</div>
			<Suspense>
				<PostListActions />
			</Suspense>
		</div>
	)
}

async function PostList() {
	const postsModule = await getCachedAllPosts()
	const { ability } = await getServerAuthSession()

	return (
		<>
			{postsModule.map((post) => (
				<Card key={post.id}>
					<CardHeader>
						<CardTitle>
							{/* posts are presented at the root of the site and not in a sub-route */}
							<Link className="w-full" href={`/${post.fields.slug || post.id}`}>
								{post.fields.title}
							</Link>
						</CardTitle>
					</CardHeader>
					{ability.can('delete', 'Content') && (
						<CardFooter>
							<div className="flex w-full justify-end">
								<DeletePostButton id={post.id} />
							</div>
						</CardFooter>
					)}
				</Card>
			))}
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
