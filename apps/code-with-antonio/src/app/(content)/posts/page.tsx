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
import type { List } from '@/lib/lists'
import { getAllLists, getList } from '@/lib/lists-query'
import { getPage } from '@/lib/pages-query'
import type { Post } from '@/lib/posts'
import { getAllPosts } from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
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
							isHighlighted
							post={primary}
							className="**:data-card:text-foreground sm:**:data-title:!text-3xl **:data-title:text-foreground **:data-card:p-8 sm:**:data-card:p-10 **:data-title:font-bold relative z-10 h-full w-full"
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
						<PostTeaser key={post.fields.slug} post={post} className="w-full" />
					))}
				</div>
			)}
		</div>
	)
}

export default async function PostsIndexPage() {
	const page = await getPage('posts-vhq68')

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
			...(latestTutorial
				? [
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
					]
				: []),
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
		<LayoutClient withContainer>
			<main className="-mx-px flex min-h-[calc(100vh-var(--nav-height))] flex-col lg:flex-row">
				<div className="mx-auto flex w-full flex-col">
					<FeaturedGrid posts={featuredContent} />
					<Search />
				</div>
				<React.Suspense fallback={null}>
					<PostListActions />
				</React.Suspense>
			</main>
		</LayoutClient>
	)
}

const PostTeaser: React.FC<{
	post?: Post | List
	i?: number
	className?: string
	isHighlighted?: boolean
}> = ({ post, className, i, isHighlighted }) => {
	if (!post) return null
	const title = post.fields.title
	const description = post.fields.description

	return (
		<li className={cn('relative flex h-full', className)}>
			{isHighlighted && (
				<div className="absolute inset-0 -z-10 flex items-center justify-center">
					<div className="bg-background absolute z-10 h-[97%] w-[98%] md:w-[97%]" />
					<CldImage
						alt=""
						src="https://res.cloudinary.com/total-typescript/image/upload/v1741960224/aihero.dev/assets/vojtaholik_wired_--no_face_robot_human_person_body_--ar_21_--sr_82bb670f-8f36-4c22-9412-4d94f90bc705_3_ht5kyu.jpg"
						fill
						className="object-cover"
					/>
				</div>
			)}
			<Link
				prefetch
				href={getResourcePath(post.type, post.fields.slug, 'view')}
				passHref
				className="flex w-full"
			>
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
							{post.type === 'cohort' && (
								<p className="text-primary inline-flex items-center gap-1 pb-1.5 font-mono text-xs font-medium uppercase">
									<Calendar className="w-3" /> Cohort-based Course
								</p>
							)}
							<CardTitle
								data-title=""
								className="!text-xl font-semibold leading-tight"
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
						{isHighlighted && (
							<Button className="mt-4 md:mt-8" variant="outline">
								Learn More <ChevronRight className="ml-2 w-3" />
							</Button>
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
	const { ability } = await getServerAuthSession()
	if (!ability.can('create', 'Content') || !ability.can('update', 'Content')) {
		return null
	}
	const allPosts = await getAllPosts()
	const allLists = await getAllLists()

	return <PostActions allPosts={allPosts} allLists={allLists} />
}
