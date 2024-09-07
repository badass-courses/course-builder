import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Contributor } from '@/app/_components/contributor'
import config from '@/config'
import { env } from '@/env.mjs'
import type { Article } from '@/lib/articles'
import { getArticles } from '@/lib/articles-query'
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

export const metadata: Metadata = {
	title: `Articles by ${config.author}`,
	openGraph: {
		images: [
			{
				url: `${env.NEXT_PUBLIC_URL}/api/og?title=${encodeURIComponent(`Articles by ${config.author}`)}`,
			},
		],
	},
}

export default async function ArticlesIndexPage() {
	const { ability } = await getServerAuthSession()
	const allArticles = await getArticles()
	const publishedPublicArticles = allArticles.filter(
		(article) =>
			article.fields.visibility === 'public' &&
			article.fields.state === 'published',
	)
	const unpublishedArticles = allArticles.filter((article) => {
		return !publishedPublicArticles.includes(article)
	})

	const latestArticle = publishedPublicArticles[0]

	return (
		<main className="container flex flex-col-reverse px-5 lg:flex-row">
			<div className="mx-auto flex w-full max-w-screen-lg flex-col sm:flex-row">
				<div className="flex flex-col items-center border-x">
					{latestArticle && (
						<div className="relative flex w-full">
							<ArticleTeaser
								article={latestArticle}
								className="[&_[data-card='']]:text-background h-full w-full md:aspect-[16/7] [&_[data-card='']]:bg-gradient-to-tr [&_[data-card='']]:from-[#3E75FE]  [&_[data-card='']]:to-purple-500 [&_[data-card='']]:p-8 [&_[data-card='']]:sm:p-10 sm:[&_[data-title='']]:text-3xl"
							/>
						</div>
					)}
					<ul className="divide-border relative grid grid-cols-1 justify-center divide-y sm:grid-cols-2">
						{publishedPublicArticles
							.slice(1, publishedPublicArticles.length)
							.map((article, i) => {
								return (
									<ArticleTeaser
										i={i}
										article={article}
										key={article.id}
										className="[&_[data-card]]:pl-8 [&_[data-title='']]:transition [&_[data-title='']]:hover:text-blue-500"
									/>
								)
							})}
					</ul>
				</div>
			</div>
			<React.Suspense
				fallback={
					<aside className="hidden w-full max-w-xs border-r lg:block" />
				}
			>
				<ArticleListActions articles={unpublishedArticles} />
			</React.Suspense>
		</main>
	)
}

const ArticleTeaser: React.FC<{
	article: Article
	i?: number
	className?: string
}> = ({ article, className, i }) => {
	const title = article.fields.title
	const description = article.fields.description
	const createdAt = article.createdAt

	return (
		<li className={cn('flex h-full', className)}>
			<Link href={`/${article.fields.slug}`} passHref className="flex w-full">
				<Card
					data-card=""
					className={cn(
						'mx-auto flex h-full w-full flex-col justify-between rounded-none border-0 bg-transparent p-8 shadow-none',
						{
							'sm:border-r': (i && i % 2 === 0) || i === 0,
						},
					)}
				>
					<div>
						<CardHeader className="p-0">
							<p className="pb-1.5 text-sm opacity-60">
								{createdAt && format(new Date(createdAt), 'MMMM do, y')}
							</p>
							<CardTitle
								data-title=""
								className="text-xl font-semibold leading-tight"
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

async function ArticleListActions({ articles }: { articles?: Article[] }) {
	const { ability, session } = await getServerAuthSession()
	return ability.can('create', 'Content') ? (
		<aside className="w-full border-x lg:max-w-xs lg:border-l-0 lg:border-r">
			<div className="border-b p-5">
				<p className="font-semibold">
					Hey {session?.user?.name?.split(' ')[0] || 'there'}!
				</p>
				<p>
					You have <strong className="font-semibold">{articles?.length}</strong>{' '}
					unpublished articles.
				</p>
			</div>
			{articles ? (
				<ul className="flex flex-col px-5 pt-5">
					{articles.map((article) => {
						return (
							<li key={article.id}>
								<Link
									className="group flex flex-col py-2"
									href={`/articles/${article.fields.slug}/edit`}
								>
									<strong className="group-hover:text-primary inline-flex items-baseline gap-1 font-semibold leading-tight transition">
										<Pencil className="text-muted-foreground h-3 w-3 flex-shrink-0" />
										<span>{article.fields.title}</span>
									</strong>
									<div className="text-muted-foreground pl-4 text-sm">
										{article.fields.state}
										{article.fields.state === 'published' &&
											` - ${article.fields.visibility}`}
									</div>
								</Link>
							</li>
						)
					})}
				</ul>
			) : null}
			{ability.can('update', 'Content') ? (
				<div className="p-5">
					<Button variant="outline" asChild className="w-full gap-1">
						<Link href={`/articles/new`}>
							<FilePlus2 className="h-4 w-4" />
							New Article
						</Link>
					</Button>
				</div>
			) : null}
		</aside>
	) : (
		<aside className="hidden w-full max-w-xs border-r lg:block" />
	)
}
