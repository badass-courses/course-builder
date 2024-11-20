import * as React from 'react'
import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CreatePost } from '@/app/(content)/posts/_components/create-post'
import { DeletePostButton } from '@/app/(content)/posts/_components/delete-post-button'
import {
	getAllPosts,
	getAllPostsForUser,
	getCachedAllPosts,
	getCachedAllPostsForUser,
} from '@/lib/posts-query'
import {
	getCachedEggheadInstructorForUser,
	loadEggheadInstructorForUser,
} from '@/lib/users'
import { getServerAuthSession } from '@/server/auth'
import { subject } from '@casl/ability'

import { ContentResource } from '@coursebuilder/core/schemas'
import {
	Button,
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Checkbox,
} from '@coursebuilder/ui'

import { PostsFilterToggle } from './_components/posts-filter-toggle'

export default async function PostsListPage({
	searchParams,
}: {
	searchParams: { [key: string]: string | undefined }
}) {
	const { ability } = await getServerAuthSession()

	return (
		<div className="bg-muted flex h-full flex-grow flex-col-reverse gap-3 p-5 md:flex-row">
			<div className="flex flex-grow flex-col space-y-2 md:order-2">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-bold">Posts</h2>
					<PostsFilterToggle canManageAll={ability.can('manage', 'all')} />
				</div>
				<Suspense>
					<PostList showAllPosts={searchParams.view === 'all'} />
				</Suspense>
			</div>
			<Suspense>
				<PostListActions />
			</Suspense>
		</div>
	)
}

async function PostList({ showAllPosts }: { showAllPosts: boolean }) {
	const { ability, session } = await getServerAuthSession()

	let postsModule

	if (ability.can('manage', 'all') && showAllPosts) {
		postsModule = await getAllPosts()
	} else {
		postsModule = await getAllPostsForUser(session?.user?.id)
	}

	return (
		<>
			{postsModule.length > 0 ? (
				postsModule.map((post: ContentResource) => {
					return (
						<Card key={post.id}>
							<CardHeader>
								<div className="flex gap-2">
									<div className="text-muted-foreground text-mono text-xs">
										{post.fields?.state} {post.fields?.postType}
									</div>
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
								<CardDescription>
									<Suspense>
										<InstructorByLine userId={post.createdById} />
									</Suspense>
								</CardDescription>
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

const InstructorByLine = async ({ userId }: { userId: string }) => {
	const instructor = await getCachedEggheadInstructorForUser(userId)
	const fullName = `${instructor?.first_name} ${instructor?.last_name}`.trim()
	return Boolean(fullName) ? (
		<div className="text-muted-foreground text-mono text-xs">{fullName}</div>
	) : null
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
