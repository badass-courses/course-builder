import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CreatePostModal } from '@/app/(content)/posts/_components/create-post-modal'
import {
	getListCompletionStats,
	getPostCompletionStats,
} from '@/lib/completions-query'
import { getServerAuthSession } from '@/server/auth'
import { format } from 'date-fns'
import { BookOpenIcon, GraduationCapIcon } from 'lucide-react'
import { z } from 'zod'

import {
	Badge,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CreateEventForm,
} from '@coursebuilder/ui'

import CreateNewEventDialog from '../../(content)/events/_components/create-new-event-dialog'

function CompletionCount({ count }: { count: number }) {
	return (
		<div className="flex min-w-[6ch] items-center justify-center text-sm font-bold tabular-nums">
			{count}
		</div>
	)
}

function EmptyState({ type }: { type: 'posts' | 'lists' }) {
	return (
		<div className="flex flex-col items-center justify-center py-8 text-center">
			{type === 'posts' ? (
				<BookOpenIcon className="text-muted-foreground/50 h-8 w-8" />
			) : (
				<GraduationCapIcon className="text-muted-foreground/50 h-8 w-8" />
			)}
			<p className="text-muted-foreground mt-2 text-sm">No {type} found</p>
		</div>
	)
}

export default async function AdminDashboardPage() {
	const { ability } = await getServerAuthSession()
	if (ability.cannot('manage', 'all')) {
		notFound()
	}

	const [postStats, listStats] = await Promise.all([
		getPostCompletionStats(),
		getListCompletionStats(),
	])

	const sortedPostStatusByCreatedAt = [...postStats].sort(
		(a, b) =>
			new Date(b?.post?.createdAt ?? '').getTime() -
			new Date(a?.post?.createdAt ?? '').getTime(),
	)

	const totalListCompletions = listStats.reduce(
		(sum, stat) => sum + stat.fullCompletions,
		0,
	)

	const totalPostCompletions = postStats.reduce(
		(sum, stat) => sum + stat.completions,
		0,
	)

	return (
		<main className="mx-auto flex w-full flex-1 flex-col gap-5 py-10 lg:gap-10">
			<div className="flex flex-col gap-2">
				<h1 className="font-heading text-xl font-bold sm:text-3xl">
					Admin Dashboard
				</h1>
				<p className="text-muted-foreground">
					Create new content and track engagement.
				</p>
			</div>
			<div className="grid grid-cols-3 gap-5">
				<Card className="relative flex flex-col justify-between">
					<CardHeader className="">
						<CardTitle>Posts</CardTitle>
						<CardDescription>
							Articles, videos, podcasts, etc. This is the most flexible content
							type and can be used for a variety of purposes.
						</CardDescription>
						<Badge className="absolute right-3 top-3" variant="outline">
							Free
						</Badge>
					</CardHeader>
					<CardContent className="">
						<CreatePostModal defaultResourceType="article" />
					</CardContent>
				</Card>
				<Card className="relative flex flex-col justify-between">
					<CardHeader className="">
						<CardTitle>Tutorials</CardTitle>
						<CardDescription>
							A free collection of video or article lessons.
						</CardDescription>
						<Badge className="absolute right-3 top-3" variant="outline">
							Free
						</Badge>
					</CardHeader>
					<CardContent className="">
						<CreatePostModal defaultResourceType="tutorial" />
					</CardContent>
				</Card>
				<Card className="flex flex-col justify-between">
					<CardHeader className="">
						<CardTitle>Live Events</CardTitle>
						<CardDescription>
							Live events are essentially virtual workshops with limited
							availability and set dates. Great way to practice new content and
							sell tickets to your community.
						</CardDescription>
					</CardHeader>
					<CardContent className="">
						<CreateNewEventDialog
							modal={true}
							className="w-full justify-between"
							buttonLabel="Create Event"
						/>
					</CardContent>
				</Card>
				<Card className="relative flex flex-col justify-between">
					<CardHeader className="">
						<CardTitle>Self-paced Workshops</CardTitle>
						<CardDescription>
							A collection of lessons sold as a product with no fixed start and
							end date. Great for creating a course that students can enroll in
							and complete at their own pace.
						</CardDescription>
					</CardHeader>
					<CardContent className="">
						<CreatePostModal defaultResourceType="workshop" />
					</CardContent>
				</Card>
				<Card className="relative flex flex-col justify-between">
					<CardHeader className="">
						<CardTitle>Cohort-based Courses</CardTitle>
						<CardDescription>
							A collection of lessons sold as a product with a fixed start and
							end enrollment date.
						</CardDescription>
					</CardHeader>
					<CardContent className="">
						<CreatePostModal defaultResourceType="cohort" />
					</CardContent>
				</Card>
			</div>
			<div className="flex flex-col gap-5">
				{listStats.length > 0 && (
					<Card>
						<CardHeader>
							<div className="flex items-center gap-5">
								<GraduationCapIcon className="text-muted-foreground h-4 w-4" />
								<div className="space-y-1">
									<CardTitle className="text-lg font-bold">
										List Completions
									</CardTitle>
									<CardDescription>
										{totalListCompletions} total completions
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="border-t px-0">
							<div className="flex flex-col divide-y">
								{listStats.map(
									({
										list,
										fullCompletions,
										partialCompletions,
										totalResources,
									}) => (
										<div
											key={list.id}
											className="flex items-center justify-between gap-4 px-3 py-4"
										>
											<CompletionCount count={fullCompletions} />
											<div className="flex-1 space-y-1">
												<Link
													href={`/${list.fields?.slug}`}
													className="truncate text-ellipsis text-base font-semibold hover:underline"
												>
													{list.fields?.title}
												</Link>
												<div className="text-muted-foreground flex items-center gap-2 text-xs">
													<span>{partialCompletions} in progress</span>
													<span>•</span>
													<span>{totalResources} resources</span>
												</div>
												<div className="bg-muted mt-2 h-1 rounded-full">
													<div
														className="h-full rounded-full bg-emerald-500 transition-all"
														style={{
															width: `${Math.min(
																(fullCompletions /
																	(fullCompletions + partialCompletions)) *
																	100,
																100,
															)}%`,
														}}
													/>
												</div>
											</div>
										</div>
									),
								)}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Posts Section */}
				<Card>
					<CardHeader>
						<div className="flex items-center gap-5">
							<BookOpenIcon className="text-muted-foreground h-4 w-4" />
							<div className="space-y-1">
								<CardTitle className="text-lg font-bold">
									Post Completions
								</CardTitle>
								<CardDescription>
									{totalPostCompletions} total completions
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className="border-t px-0">
						{sortedPostStatusByCreatedAt.length > 0 ? (
							<div className="flex flex-col divide-y">
								{sortedPostStatusByCreatedAt.map(({ post, completions }) => (
									<div
										key={post.id}
										className="flex items-center justify-between gap-4 px-3 py-4"
									>
										<CompletionCount count={completions} />
										<div className="flex-1 space-y-1">
											<Link
												href={`/${post.fields.slug}`}
												className="truncate text-ellipsis text-base font-semibold hover:underline"
											>
												{post.fields.title}
											</Link>
											<div className="flex items-center gap-2">
												<p className="text-muted-foreground text-xs">
													{((completions / totalPostCompletions) * 100).toFixed(
														1,
													)}
													% of total
												</p>
												<p className="text-muted-foreground text-xs">
													{format(
														new Date(post?.createdAt ?? ''),
														'MMM d, yyyy',
													)}
												</p>
											</div>
										</div>
									</div>
								))}
							</div>
						) : (
							<EmptyState type="posts" />
						)}
					</CardContent>
				</Card>
			</div>
		</main>
	)
}
