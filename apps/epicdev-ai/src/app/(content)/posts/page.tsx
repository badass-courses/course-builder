import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Search from '@/app/(search)/q/_components/search'
import { CldImage } from '@/components/cld-image'
import { Contributor } from '@/components/contributor'
import LayoutClient from '@/components/layout-client'
import config from '@/config'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { env } from '@/env.mjs'
import type { Event } from '@/lib/events'
import type { List } from '@/lib/lists'
import { getAllLists, getList } from '@/lib/lists-query'
import { getPage } from '@/lib/pages-query'
import type { Post } from '@/lib/posts'
import { getAllPosts } from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { formatInTimeZone } from 'date-fns-tz'
import { desc, inArray, sql } from 'drizzle-orm'
import { Book, Calendar, ChevronRight } from 'lucide-react'

import {
	Badge,
	Button,
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

import { PostActions } from './_components/post-actions'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
	title: `AI Engineering Posts by ${config.author}`,
	openGraph: {
		images: [
			{
				url: `${env.NEXT_PUBLIC_URL}/api/og?title=${encodeURIComponent(`AI Engineering Posts by ${config.author}`)}`,
			},
		],
	},
}

const FeaturedGrid = ({
	posts,
}: {
	posts: (
		| Post
		| List
		| (Event & {
				fields: {
					featured: {
						priority: number
						layout: 'primary' | 'secondary' | 'tertiary'
					}
				}
		  })
	)[]
}) => {
	const primary = posts?.find((p) => p?.fields?.featured?.layout === 'primary')
	const secondary = posts
		?.filter((p) => p?.fields?.featured?.layout === 'secondary')
		.sort(
			(a, b) =>
				(a?.fields?.featured?.priority || 0) -
				(b?.fields?.featured?.priority || 0),
		)

	if (!posts?.length) return null

	return (
		<div className="h-[calc(360px-(var(--nav-height)+20px))] px-2 pt-5 sm:h-[calc(320px-(var(--nav-height)+20px))] sm:pt-10">
			<div className="grid grid-cols-1">
				{/* Primary hero */}
				{primary && (
					<PostTeaser
						isHighlighted
						post={primary}
						className="**:data-card:text-foreground **:data-card:bg-transparent! **:data-card:p-0 hover:**:data-title:text-primary sm:**:data-title:fluid-2xl **:data-title:fluid-xl **:data-title:text-foreground sm:**:data-card:p-0 **:data-card:border-0 **:data-title:font-semibold **:data-title:transition dark:**:data-card:bg-transparent dark:**:data-card:border-0 dark relative z-10 h-full w-full shadow-none"
					/>
				)}

				{/* Secondary posts */}
				{secondary.length > 0 && (
					<div className="flex flex-col">
						{secondary.slice(0, 2).map((post) => (
							<PostTeaser key={post.fields.slug} post={post} className="" />
						))}
					</div>
				)}
			</div>
			{secondary.length > 2 && (
				<div className="grid grid-cols-1 md:grid-cols-2">
					{secondary.slice(2).map((post, i) => (
						<PostTeaser key={post.fields.slug} post={post} className="w-full" />
					))}
				</div>
			)}
		</div>
	)
}

export default async function PostsIndexPage() {
	const page = await getPage('posts')

	let featuredContent: any[] = [
		// First featured item
		page?.resources?.[0]?.resource
			? {
					...page?.resources[0].resource,
					fields: {
						...page?.resources[0].resource.fields,
						featured: {
							priority: 1,
							layout: 'primary',
						},
					},
				}
			: null,
		// Rest of the featured items
		...(page?.resources?.slice(1)?.map((contentResource, index) => ({
			...contentResource.resource,
			fields: {
				...contentResource.resource.fields,
				featured: {
					priority: index + 1,
					layout: 'secondary',
				},
			},
		})) || []),
	].filter(Boolean)

	// if (featuredContent.length < 4) {
	// 	const latestTutorial = await getList('vercel-ai-sdk-tutorial')

	// 	const featuredSlugs = [
	// 		'the-prompt-report',
	// 		'three-types-of-evals',
	// 		'building-effective-agents',
	// 		'evalite-an-early-preview',
	// 	]

	// 	const posts = await db.query.contentResource.findMany({
	// 		where: inArray(
	// 			sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
	// 			featuredSlugs,
	// 		),
	// 		orderBy: desc(contentResource.createdAt),
	// 		with: {
	// 			resources: {
	// 				with: {
	// 					resource: true,
	// 				},
	// 			},
	// 			tags: {
	// 				with: {
	// 					tag: true,
	// 				},
	// 			},
	// 		},
	// 	})

	// 	// Fallback featured content
	// 	featuredContent = [
	// 		...(latestTutorial
	// 			? [
	// 					{
	// 						...latestTutorial,
	// 						fields: {
	// 							...latestTutorial.fields,
	// 							featured: {
	// 								priority: 1,
	// 								layout: 'primary',
	// 							},
	// 						},
	// 					},
	// 				]
	// 			: []),
	// 		...posts.map((post, index) => {
	// 			return {
	// 				fields: {
	// 					...post.fields,
	// 					featured: {
	// 						priority: index + 1,
	// 						layout: 'secondary',
	// 					},
	// 				},
	// 			}
	// 		}),
	// 	]
	// }

	return (
		<>
			<LayoutClient
				navigationClassName={
					featuredContent.length > 0
						? 'bg-transparent [&_ul]:divide-x-0 [&_[data-logo]]:border-r-0 dark [&_[data-nav-link]]:hover:bg-transparent! [&_[data-mobile-nav-trigger]]:bg-white/80 [&_[data-mobile-nav-trigger]]:text-black'
						: ''
				}
				withContainer
			>
				<main className="mx-auto flex min-h-[calc(100vh-var(--nav-height))] w-full flex-col lg:flex-row">
					<div className="mx-auto flex w-full flex-col pb-24">
						<FeaturedGrid posts={featuredContent} />
						<Search />
					</div>
					<React.Suspense fallback={null}>
						<PostListActions />
					</React.Suspense>
				</main>
			</LayoutClient>
			{featuredContent.length > 0 && (
				<div
					className="absolute inset-0 h-[360px] w-full bg-gradient-to-b from-slate-900 to-indigo-950 sm:h-[320px]"
					aria-hidden="true"
				/>
			)}
		</>
	)
}

const PostTeaser: React.FC<{
	post?: Post | List | Event
	i?: number
	className?: string
	isHighlighted?: boolean
}> = ({ post, className, i, isHighlighted }) => {
	if (!post) return null
	const title = post.fields.title
	const description = post.fields.description

	return (
		<li className={cn('relative flex h-full', className)}>
			<Link
				prefetch
				href={getResourcePath(post.type, post.fields.slug, 'view')}
				passHref
				className="flex w-full"
			>
				<Card
					data-card=""
					className={cn(
						'mx-auto flex h-full w-full flex-col justify-between border bg-white p-8 shadow-xl shadow-gray-800/10 transition duration-300 ease-in-out dark:border-white/5 dark:bg-white/5',
						{
							// 'sm:border-r': (i && i % 2 === 0) || i === 0,
						},
					)}
				>
					<div className="">
						<CardHeader className="p-0">
							{post?.fields &&
								'type' in post.fields &&
								post.fields.type === 'tutorial' && (
									<p className="text-primary inline-flex items-center gap-1 pb-1.5 font-mono text-xs font-medium uppercase">
										<Book className="w-3" /> Free Tutorial
									</p>
								)}
							<CardTitle
								data-title=""
								className="fluid-xl font-heading font-semibold leading-tight tracking-tight"
							>
								{title}
							</CardTitle>
							{post &&
								post.type === 'event' &&
								post.fields &&
								'startsAt' in post.fields &&
								post.fields.startsAt && (
									<p className="text-primary inline-flex items-center gap-1 pb-1.5 font-mono text-xs font-medium uppercase">
										<Calendar className="w-3" />{' '}
										{formatInTimeZone(
											post.fields.startsAt,
											post.fields.timezone || 'America/Los_Angeles',
											'MMM d, y - h:mmaaa',
										)}{' '}
										PT
									</p>
								)}
						</CardHeader>

						{description && (
							<CardContent className="p-0">
								<p className="text-balance pt-4 text-sm opacity-80 sm:text-base">
									{description}
								</p>
							</CardContent>
						)}
					</div>
					<div>
						<CardFooter
							data-footer=""
							className="mt-4 flex flex-col items-start justify-between gap-5 p-0 text-sm sm:mt-8 sm:flex-row sm:items-center"
						>
							<div className="flex flex-wrap items-center gap-4">
								<Contributor className="flex-shrink-0 [&_img]:size-8 sm:[&_img]:size-10" />
								{post.tags && post.tags.length > 0 && (
									<div className="flex items-center gap-1">
										{post.tags.map((tag) => {
											return tag?.tag?.fields?.label ? (
												<Badge
													key={tag.tagId}
													variant="outline"
													className="rounded-full"
												>
													# {tag.tag.fields.label}
												</Badge>
											) : null
										})}
									</div>
								)}
							</div>
							<div className="flex items-center gap-2">
								{isHighlighted && (
									<Button
										className="hover:bg-card-muted bg-white text-violet-700 transition ease-out"
										variant="default"
									>
										{post.type === 'event' ? 'Get Your Ticket' : 'Read More'}{' '}
										<ChevronRight className="ml-2 w-3" />
									</Button>
								)}
							</div>
						</CardFooter>
					</div>
				</Card>
			</Link>
		</li>
	)
}

async function PostListActions({}: {}) {
	const { ability } = await getServerAuthSession()
	if (!ability.can('create', 'Content') || !ability.can('update', 'Content')) {
		return null
	}
	const allPosts = await getAllPosts()
	const allLists = await getAllLists()

	return <PostActions allPosts={allPosts} allLists={allLists} />
}
