import * as React from 'react'
import { Suspense } from 'react'
import { CreatePost } from '@/app/(content)/posts/_components/create-post'
import { logger } from '@/lib/utils/logger'
import { getServerAuthSession } from '@/server/auth'

import PostList from './_components/post-list'
import {
	CreatePostSkeleton,
	PostListSkeleton,
} from './_components/post-list-skeleton'
import { PostsFilterToggle } from './_components/posts-filter-toggle'
import { PostsSearchFilter } from './_components/posts-search-filter'

export default async function PostsListPage(props: {
	searchParams: Promise<{ [key: string]: string | undefined }>
}) {
	const searchParams = await props.searchParams
	const { ability } = await getServerAuthSession()

	// Parse pagination parameters with defaults
	const page = Number(searchParams.page) || 1
	const pageSize = Number(searchParams.pageSize) || 50

	logger.info('Posts page loaded', {
		page,
		pageSize,
		calculatedOffset: (page - 1) * pageSize,
	})

	return (
		<div className="bg-muted w-full">
			<div className="mx-auto h-full max-w-screen-xl gap-3 p-5">
				<Suspense fallback={<CreatePostSkeleton />}>
					<PostListActions />
				</Suspense>
				<div className="mt-4 flex w-full flex-col space-y-2 md:order-2">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-bold">Posts</h2>
						<PostsFilterToggle canManageAll={ability.can('manage', 'all')} />
					</div>
					<Suspense fallback={<PostListSkeleton />}>
						<div className="w-full">
							<div className="mb-4">
								<PostsSearchFilter />
							</div>
							<PostList
								showAllPosts={searchParams.view === 'all'}
								search={searchParams.search}
								postType={searchParams.postType}
								page={page}
								pageSize={pageSize}
							/>
						</div>
					</Suspense>
				</div>
			</div>
		</div>
	)
}

async function PostListActions() {
	const { ability } = await getServerAuthSession()
	return (
		<>
			{ability.can('create', 'Content') ? (
				<div className="order-1 h-full max-w-lg flex-grow md:order-2">
					<h1 className="pb-2 text-lg font-bold">Create Post</h1>
					<CreatePost />
				</div>
			) : null}
		</>
	)
}
