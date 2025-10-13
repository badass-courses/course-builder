import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Contributor } from '@/app/_components/contributor'
import config from '@/config'
import { env } from '@/env.mjs'
import type { List } from '@/lib/lists'
import { getAllLists } from '@/lib/lists-query'
import type { Post } from '@/lib/posts'
import { getAllPosts } from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { format } from 'date-fns'
import { ListOrderedIcon, Pencil } from 'lucide-react'
import pluralize from 'pluralize'

import {
	Badge,
	Button,
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

import { CreatePost, CreatePostModal } from './_components/create-post'

export const metadata: Metadata = {
	title: `Local First Posts by ${config.author}`,
	openGraph: {
		images: [
			{
				url: `${env.NEXT_PUBLIC_URL}/api/og?title=${encodeURIComponent(`Local First Posts by ${config.author}`)}`,
			},
		],
	},
}

export default async function PostsIndexPage() {
	const { ability } = await getServerAuthSession()
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

	const latestPost = publishedPublicPosts[0]

	return (
		<main className="container flex flex-grow flex-col px-5 py-5 lg:flex-row">
			<div className="max-w-(--breakpoint-lg) mx-auto flex w-full flex-col sm:flex-row">
				<div className="flex w-full flex-col items-center">
					{latestPost ? null : (
						<h1 className="flex w-full py-16 text-center text-2xl">
							No posts found.
						</h1>
					)}
					<ul className="relative flex w-full flex-col justify-center gap-3">
						{publishedPublicPosts.map((post, i) => {
							return <PostTeaser i={i} post={post} key={post.id} className="" />
						})}
					</ul>
				</div>
			</div>
			<React.Suspense
				fallback={<aside className="hidden w-full max-w-xs lg:block" />}
			>
				<PostListActions
					publishedPosts={publishedPublicPosts}
					unpublishedPosts={unpublishedPosts}
					lists={allLists}
				/>
			</React.Suspense>
		</main>
	)
}

const PostTeaser: React.FC<{
	post: Post
	i?: number
	className?: string
}> = ({ post, className, i }) => {
	const title = post.fields.title
	const description = post.fields.description
	const createdAt = post.createdAt

	return (
		<li className={cn('bg-card text-card-foreground flex h-full', className)}>
			<Link href={`/${post.fields.slug}`} passHref className="flex w-full">
				<Card
					className={cn('w-full p-5', {
						// 'sm:border-r': (i && i % 2 === 0) || i === 0,
					})}
				>
					<div className="">
						<CardHeader className="p-0">
							<CardTitle
								data-title=""
								className="fluid-xl font-semibold leading-tight"
							>
								{title}
							</CardTitle>
						</CardHeader>
						{description && (
							<CardContent className="p-0">
								<p className="text-balance pt-4 text-sm opacity-75">
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
							<Contributor contributor={post.createdBy} />
							<div className="flex items-center gap-1.5">
								<p className="text-muted-foreground text-sm opacity-60">
									{createdAt && format(new Date(createdAt), 'MMMM do, y')}
								</p>
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
						</CardFooter>
					</div>
				</Card>
			</Link>
		</li>
	)
}

async function PostListActions({
	unpublishedPosts,
	publishedPosts,
	lists,
}: {
	publishedPosts: Post[]
	unpublishedPosts?: Post[]
	lists?: List[]
}) {
	const { ability, session } = await getServerAuthSession()
	const drafts = unpublishedPosts?.filter(
		({ fields }) =>
			fields.state === 'draft' && fields.visibility !== 'unlisted',
	)
	const unlisted = unpublishedPosts?.filter(
		({ fields }) => fields.visibility === 'unlisted',
	)

	return ability.can('create', 'Content') ? (
		<aside className="w-full gap-3 lg:max-w-xs">
			<div className="p-5 px-0 lg:px-5 lg:pt-0">
				<p className="font-semibold">
					Hey {session?.user?.name?.split(' ')[0] || 'there'}!
				</p>

				{drafts && drafts?.length > 0 ? (
					<p className="opacity-75">
						You have <strong className="font-semibold">{drafts?.length}</strong>{' '}
						unpublished{' '}
						{drafts?.length ? pluralize('post', drafts.length) : 'post'}.
					</p>
				) : (
					<p className="opacity-75">
						You've published {publishedPosts.length}{' '}
						{pluralize('post', publishedPosts.length)}.
					</p>
				)}
			</div>
			{drafts && drafts.length > 0 ? (
				<ul className="flex flex-col pt-4 lg:px-5">
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
				<ul className="flex flex-col pt-4 lg:px-5">
					<strong>Unlisted</strong>
					{unlisted.map((post) => {
						const postLists =
							lists &&
							lists.filter((list) =>
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
												className="text-muted-foreground hover:text-primary flex items-center gap-1"
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
				<div className="mt-5 flex flex-col gap-2 py-5 lg:px-5">
					<CreatePostModal />
					<Button variant="outline" asChild>
						<Link href="/lists">Manage Lists</Link>
					</Button>
				</div>
			) : null}
		</aside>
	) : null // <aside className="hidden w-full max-w-xs lg:block" />
}
