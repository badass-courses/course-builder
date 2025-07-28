import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
// Internal
import { DeletePostButton } from '@/app/(content)/posts/_components/delete-post-button'
import { InstructorSkeleton } from '@/app/(content)/posts/_components/post-list-skeleton'
import type { MinimalPost } from '@/lib/posts'
import {
	countAllMinimalPosts,
	countAllMinimalPostsForUser,
	getAllMinimalPosts,
	getAllMinimalPostsForUser,
	getCachedAllMinimalPosts,
	getCachedAllMinimalPostsForUser,
} from '@/lib/posts-query'
import {
	getCachedEggheadInstructorForUser,
	loadEggheadInstructorForUser,
} from '@/lib/users'
import { logger } from '@/lib/utils/logger'
import { getServerAuthSession } from '@/server/auth'
import { subject } from '@casl/ability'
import { Calendar, Edit3, Tag, Trash, User } from 'lucide-react'

import {
	Button,
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Checkbox,
} from '@coursebuilder/ui'

import { PostsPagination } from './posts-pagination'

/**
 * Displays a list of posts with optional filtering by search term and post type.
 * Uses cached data when no filters are applied, and fetches fresh data when filtering.
 *
 * @param showAllPosts - Whether to show all posts or only user's posts
 * @param search - Optional search term to filter posts by title
 * @param postType - Optional post type filter
 */
export default async function PostList({
	showAllPosts,
	search,
	postType,
	page = 1,
	pageSize = 50,
}: {
	showAllPosts: boolean
	search?: string
	postType?: string
	page?: number
	pageSize?: number
}) {
	const { ability, session } = await getServerAuthSession()

	// Calculate offset for pagination
	const offset = (page - 1) * pageSize

	let postsModule
	let totalCount = 0

	// Use cached versions when no search params, non-cached when filtering
	const hasSearchParams = Boolean(
		search || postType || page !== 1 || pageSize !== 50,
	)

	// Fetch posts and count in parallel
	if (ability.can('manage', 'all') && showAllPosts) {
		if (hasSearchParams) {
			const [posts, count] = await Promise.all([
				getAllMinimalPosts(search, postType, pageSize, offset),
				countAllMinimalPosts(search, postType),
			])
			postsModule = posts
			totalCount = count
		} else {
			postsModule = await getCachedAllMinimalPosts()
			// For cached version, we'll need to count all posts without filters
			totalCount = await countAllMinimalPosts()
		}
	} else {
		if (hasSearchParams) {
			const [posts, count] = await Promise.all([
				getAllMinimalPostsForUser(
					session?.user?.id,
					search,
					postType,
					pageSize,
					offset,
				),
				countAllMinimalPostsForUser(session?.user?.id, search, postType),
			])
			postsModule = posts
			totalCount = count
		} else {
			postsModule = await getCachedAllMinimalPostsForUser(session?.user?.id)
			// For cached version, count user's posts without filters
			totalCount = await countAllMinimalPostsForUser(session?.user?.id)
		}
	}

	logger.info('PostList rendered', {
		showingPosts: `${offset + 1}-${Math.min(offset + pageSize, totalCount)}`,
		totalPosts: totalCount,
		pages: Math.ceil(totalCount / pageSize),
	})

	return (
		<>
			{postsModule && postsModule.length > 0 ? (
				<div className="space-y-1">
					{postsModule.map((post: MinimalPost) => {
						return (
							<div
								key={post.id}
								className="bg-background hover:border-border group flex items-center justify-between rounded-lg border border-transparent px-3 py-2 transition-all hover:shadow-sm"
							>
								{/* Title on the left */}
								<div className="min-w-0 flex-1">
									<Link
										className="block w-full"
										href={`/${post?.fields?.slug || post.id}`}
									>
										<h3 className="text-foreground hover:text-primary truncate font-medium transition-colors">
											{post?.fields?.title || 'Untitled Post'}
										</h3>
									</Link>
								</div>

								{/* Metadata on the right - hidden on mobile */}
								<div className="text-muted-foreground hidden items-center gap-3 text-xs md:flex">
									{/* State and Type */}
									<span className="font-medium">
										{post.fields?.state} {post.fields?.postType}
									</span>

									{/* Date */}
									{post.createdAt && (
										<div className="flex items-center gap-1">
											<Calendar className="h-3 w-3" />
											<span>
												{new Date(post.createdAt).toLocaleDateString('en-US', {
													month: 'short',
													day: 'numeric',
												})}
											</span>
										</div>
									)}

									{/* Tag count */}
									<div
										className={`flex items-center gap-1 ${post.tags && post.tags.length > 0 ? '' : 'text-red-400'}`}
									>
										<Tag className="h-3 w-3" />
										<span>{post.tags?.length || 0}</span>
									</div>

									{/* Author */}
									<Suspense fallback={<InstructorSkeleton />}>
										<InstructorByLine userId={post.createdById} />
									</Suspense>
								</div>

								{/* Action buttons */}
								{ability.can('manage', subject('Content', post)) && (
									<div className="ml-2 flex items-center gap-1">
										<Button
											size="icon"
											variant="ghost"
											className="h-7 w-7 border border-gray-200 bg-white/90 text-gray-900 hover:bg-white dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-100 dark:hover:bg-gray-900"
											asChild
										>
											<Link href={`/posts/${post.id}/edit`} title="Edit post">
												<Edit3 className="h-3.5 w-3.5" />
											</Link>
										</Button>
										<DeletePostButton id={post.id} />
									</div>
								)}
							</div>
						)
					})}
				</div>
			) : (
				<div className="text-muted-foreground flex h-full justify-center">
					{totalCount === 0
						? 'No posts found. Create a post to get started'
						: `No posts found on page ${page}`}
				</div>
			)}

			{/* Show pagination only when there are posts */}
			{totalCount > 0 && (
				<PostsPagination
					currentPage={page}
					pageSize={pageSize}
					totalCount={totalCount}
				/>
			)}
		</>
	)
}

/**
 * Fetches and displays the instructor's full name for a given user ID.
 * Returns null if no valid name is found.
 *
 * @param userId - The ID of the user to fetch instructor data for
 */
const InstructorByLine = async ({ userId }: { userId: string }) => {
	const instructor = await getCachedEggheadInstructorForUser(userId)
	const fullName = `${instructor?.first_name} ${instructor?.last_name}`.trim()

	return Boolean(fullName) ? (
		<div className="text-muted-foreground text-mono text-xs">{fullName}</div>
	) : null
}
