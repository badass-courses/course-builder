import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Contributor } from '@/app/_components/contributor'
import config from '@/config'
import { env } from '@/env.mjs'
import type { Post } from '@/lib/posts'
import { getAllPosts } from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { format } from 'date-fns'
import { FilePlus2, Pencil } from 'lucide-react'

import {
	Button,
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

import { CreatePost, CreatePostModal } from './_components/create-post'

export const metadata: Metadata = {
	title: `Local-First Posts by ${config.author}`,
	openGraph: {
		images: [
			{
				url: `${env.NEXT_PUBLIC_URL}/api/og?title=${encodeURIComponent(`Local-First Posts by ${config.author}`)}`,
			},
		],
	},
}

export default async function PostsIndexPage() {
	const { ability } = await getServerAuthSession()
	const allPosts = await getAllPosts()

	const publishedPublicPosts = [...allPosts].filter(
		(post) =>
			post.fields.visibility === 'public' && post.fields.state === 'published',
	)
	const unpublishedPosts = allPosts.filter((post) => {
		return !publishedPublicPosts.includes(post)
	})

	const latestPost = publishedPublicPosts[0]

	return (
		<main className="container flex min-h-[calc(100vh-var(--nav-height))] flex-col lg:flex-row">
			<div className="mx-auto flex w-full max-w-screen-lg flex-col sm:flex-row">
				<div className="flex w-full flex-col items-center">
					{latestPost ? (
						<div className="relative flex w-full">
							<PostTeaser
								post={latestPost}
								className="[&_[data-card='']]:bg-primary text-primary-foreground [&_[data-card='']]:text-primary-foreground sm:[&_[data-title='']]:fluid-3xl [&_[data-title='']]:text-primary-foreground h-full w-full md:aspect-[16/7] [&_[data-card='']]:p-8 [&_[data-card='']]:hover:brightness-110 [&_[data-card='']]:sm:p-10 [&_[data-title='']]:font-bold"
							/>
							<div
								className="via-primary/20 absolute bottom-0 left-0 h-px w-2/3 bg-gradient-to-r from-transparent to-transparent"
								aria-hidden="true"
							/>
						</div>
					) : (
						<h1 className="flex w-full py-16 text-center text-2xl">
							No posts found.
						</h1>
					)}
					<ul className="relative grid w-full grid-cols-1 justify-center sm:grid-cols-2">
						{publishedPublicPosts
							.slice(1, publishedPublicPosts.length)
							.map((post, i) => {
								return (
									<PostTeaser i={i} post={post} key={post.id} className="" />
								)
							})}
					</ul>
				</div>
			</div>
			<React.Suspense
				fallback={<aside className="hidden w-full max-w-xs lg:block" />}
			>
				<PostListActions posts={unpublishedPosts} />
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
		<li className={cn('flex h-full', className)}>
			<Link href={`/${post.fields.slug}`} passHref className="flex w-full">
				<Card
					data-card=""
					className={cn(
						'hover:bg-muted/50 text-foreground mx-auto flex h-full w-full flex-col justify-between rounded-none border-0 bg-transparent p-8 shadow-none transition duration-300 ease-in-out',
						{
							'bg-card/5': (i && i % 2 === 0) || i === 0,
						},
					)}
				>
					<div className="">
						<CardHeader className="p-0">
							<p className="pb-1.5 text-sm opacity-60">
								{createdAt && format(new Date(createdAt), 'MMMM do, y')}
							</p>
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
							className="mt-8 flex items-center gap-1.5 p-0 text-sm"
						>
							<Contributor />
						</CardFooter>
					</div>
				</Card>
			</Link>
		</li>
	)
}

async function PostListActions({ posts }: { posts?: Post[] }) {
	const { ability, session } = await getServerAuthSession()
	return ability.can('create', 'Content') ? (
		<aside className="w-full lg:max-w-xs">
			<div className="border-b p-5">
				<p className="font-semibold">
					Hey {session?.user?.name?.split(' ')[0] || 'there'}!
				</p>
				<p>
					You have <strong className="font-semibold">{posts?.length}</strong>{' '}
					unpublished posts.
				</p>
			</div>
			{posts ? (
				<ul className="flex flex-col px-5 pt-5">
					{posts.map((post) => {
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
									<div className="text-muted-foreground pl-4 text-sm">
										{post.fields.state}
										{post.fields.state === 'published' &&
											` - ${post.fields.visibility}`}
									</div>
								</Link>
							</li>
						)
					})}
				</ul>
			) : null}
			{ability.can('update', 'Content') ? (
				<div className="p-5">
					<CreatePostModal />
				</div>
			) : null}
		</aside>
	) : (
		<aside className="hidden w-full max-w-xs lg:block" />
	)
}
