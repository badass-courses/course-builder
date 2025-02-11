import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Search from '@/app/(search)/q/_components/search'
import { Contributor } from '@/components/contributor'
import config from '@/config'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { env } from '@/env.mjs'
import type { List } from '@/lib/lists'
import { getAllLists, getList } from '@/lib/lists-query'
import { getPage } from '@/lib/pages-query'
import type { Post } from '@/lib/posts'
import { getAllPosts } from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { desc, inArray, sql } from 'drizzle-orm'
import { Book, ListOrderedIcon, Pencil } from 'lucide-react'
import pluralize from 'pluralize'

import {
	Badge,
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

import { CreatePostModal } from './_components/create-post'

// export const experimental_ppr = true
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

const FeaturedGrid = ({ posts }: { posts: (Post | List)[] }) => {
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
		<div className="">
			<div className="grid grid-cols-1 border-x md:grid-cols-2 md:divide-x">
				{/* Primary hero */}
				{primary && (
					<div className="relative overflow-hidden">
						<PostTeaser
							post={primary}
							className="[&_[data-card='']]:bg-foreground/5 [&_[data-card='']]:hover:bg-foreground/10 [&_[data-card='']]:text-foreground sm:[&_[data-title='']]:fluid-3xl [&_[data-title='']]:text-foreground relative z-10 h-full w-full [&_[data-card='']]:p-8 [&_[data-card='']]:sm:p-10 [&_[data-title='']]:font-bold"
						/>
					</div>
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
				<div className="grid grid-cols-1 divide-x border-x md:grid-cols-2">
					{secondary.slice(2).map((post, i) => (
						<PostTeaser
							key={post.fields.slug}
							post={post}
							className=" w-full"
						/>
					))}
				</div>
			)}
		</div>
	)
}

export default async function PostsIndexPage() {
	const page = await getPage('posts-vhq68')
	console.log('page', page)

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

	if (featuredContent.length < 4) {
		const latestTutorial = await getList('vercel-ai-sdk-tutorial')

		const featuredSlugs = [
			'the-prompt-report',
			'three-types-of-evals',
			'building-effective-agents',
			'evalite-an-early-preview',
		]

		const posts = await db.query.contentResource.findMany({
			where: inArray(
				sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
				featuredSlugs,
			),
			orderBy: desc(contentResource.createdAt),
			with: {
				resources: {
					with: {
						resource: true,
					},
				},
				tags: {
					with: {
						tag: true,
					},
				},
			},
		})

		// Fallback featured content
		featuredContent = [
			{
				...latestTutorial,
				fields: {
					...latestTutorial.fields,
					featured: {
						priority: 1,
						layout: 'primary',
					},
				},
			},
			...posts.map((post, index) => {
				return {
					fields: {
						...post.fields,
						featured: {
							priority: index + 1,
							layout: 'secondary',
						},
					},
				}
			}),
		]
	}

	return (
		<main className="container flex min-h-[calc(100vh-var(--nav-height))] flex-col px-5 lg:flex-row">
			<div className="mx-auto flex w-full flex-col">
				<FeaturedGrid posts={featuredContent} />
				<Search />
			</div>
			<React.Suspense fallback={null}>
				<PostListActions />
			</React.Suspense>
		</main>
	)
}

const PostTeaser: React.FC<{
	post?: Post | List
	i?: number
	className?: string
}> = ({ post, className, i }) => {
	if (!post) return null
	const title = post.fields.title
	const description = post.fields.description

	return (
		<li className={cn('flex h-full', className)}>
			<Link href={`/${post.fields.slug}`} passHref className="flex w-full">
				<Card
					data-card=""
					className={cn(
						'hover:bg-muted/50 mx-auto flex h-full w-full flex-col justify-between rounded-none border-0 border-b bg-transparent p-8 shadow-none transition duration-300 ease-in-out',
						{
							'sm:border-r': (i && i % 2 === 0) || i === 0,
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
								className="fluid-xl font-semibold leading-tight"
							>
								{title}
							</CardTitle>
						</CardHeader>
						{description && (
							<CardContent className="p-0">
								<p className="text-balance pt-4 text-sm opacity-75 sm:text-base">
									{description}
								</p>
							</CardContent>
						)}
					</div>
					<div>
						<CardFooter
							data-footer=""
							className="mt-8 flex items-center justify-between gap-1.5 p-0 text-sm"
						>
							<Contributor />
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
						</CardFooter>
					</div>
				</Card>
			</Link>
		</li>
	)
}

async function PostListActions({}: {}) {
	const { ability, session } = await getServerAuthSession()
	if (!ability.can('create', 'Content')) {
		return null // <aside className="hidden w-full max-w-xs border-r lg:block" />
	}
	const allPosts = await getAllPosts()
	const allLists = await getAllLists()

	const publishedPublicPosts = [...allPosts, ...allLists]
		.filter(
			(post) =>
				post.fields.visibility === 'public' &&
				post.fields.state === 'published',
		)
		.sort((a, b) => {
			return b.createdAt && a.createdAt
				? new Date(b.createdAt).getTime() - new Date(a?.createdAt).getTime()
				: 0
		})

	const unpublishedPosts = allPosts.filter((post) => {
		return !publishedPublicPosts.includes(post) && post.type === 'post'
	})

	const drafts = unpublishedPosts?.filter(
		({ fields }) =>
			fields.state === 'draft' && fields.visibility !== 'unlisted',
	)
	const unlisted = unpublishedPosts?.filter(
		({ fields }) => fields.visibility === 'unlisted',
	)

	return (
		<aside className="divide-border bg-card bottom-5 right-5 z-20 my-5 w-full gap-3 divide-y border lg:fixed lg:my-0 lg:w-64">
			<div className="p-5 py-3">
				<p className="font-semibold">
					Hey {session?.user?.name?.split(' ')[0] || 'there'}!
				</p>

				{drafts && drafts?.length > 0 ? (
					<p className="text-sm opacity-75">
						You have <strong className="font-semibold">{drafts?.length}</strong>{' '}
						unpublished{' '}
						{drafts?.length ? pluralize('post', drafts.length) : 'post'}.
					</p>
				) : (
					<p className="opacity-75">
						You've published {publishedPublicPosts.length} posts.
					</p>
				)}
			</div>
			{drafts && drafts.length > 0 ? (
				<ul className="flex max-h-[300px] flex-col overflow-y-auto px-5 pt-4">
					<strong>Drafts</strong>
					{drafts.map((post) => {
						return (
							<li key={post.id}>
								<Link
									className="group flex flex-col py-2"
									href={`/posts/${post.fields.slug}/edit`}
								>
									<strong className="group-hover:text-primary inline-flex items-baseline gap-1 font-semibold leading-tight transition">
										<Pencil className="text-muted-foreground h-3 w-3 flex-shrink-0" />
										<span>{post.fields.title}</span>
									</strong>
								</Link>
							</li>
						)
					})}
				</ul>
			) : null}
			{unlisted && unlisted.length > 0 ? (
				<ul className=" flex flex-col px-5 pt-4">
					<strong>Unlisted</strong>
					{unlisted.map((post) => {
						const postLists =
							allLists &&
							allLists.filter((list) =>
								list.resources.filter(
									({ resource }) => resource.id === post.id,
								),
							)

						return (
							<li key={post.id}>
								<Link
									className="group flex flex-col pt-2"
									href={`/posts/${post.fields.slug}/edit`}
								>
									<strong className="group-hover:text-primary inline-flex items-baseline gap-1 font-semibold leading-tight transition">
										<span>{post.fields.title}</span>
									</strong>
								</Link>
								<div className="text-muted-foreground flex flex-col gap-1 pb-2 text-sm">
									{postLists &&
										postLists.map((postList) => (
											<Link
												key={postList.id}
												href={`/lists/${postList?.fields.slug}/edit`}
												className="text-muted-foreground hover:text-primary flex items-center gap-1 "
											>
												<ListOrderedIcon className="w-3" />
												{postList && postList.fields.title}
											</Link>
										))}
								</div>
							</li>
						)
					})}
				</ul>
			) : null}
			{ability.can('update', 'Content') ? (
				<div className="mt-5 border-t p-5">
					<CreatePostModal />
				</div>
			) : null}
		</aside>
	)
}
