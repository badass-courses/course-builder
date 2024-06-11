import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Contributor } from '@/app/_components/contributor'
import config from '@/config'
import type { Article } from '@/lib/articles'
import { getArticles } from '@/lib/articles-query'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { format } from 'date-fns'
import { FilePlus2 } from 'lucide-react'

import {
	Button,
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

export const metadata: Metadata = {
	title: `Next.js Articles by ${config.author}`,
}

export default async function ArticlesIndexPage() {
	const { ability } = await getServerAuthSession()
	const articles = await getArticles()
	const firstArticle = articles[0]

	return (
		<main className="container px-5">
			<div className="mx-auto flex w-full max-w-screen-lg flex-col sm:flex-row">
				{/* <aside className="px-5 py-5 sm:px-8 sm:py-16"> */}
				{/* <SearchBar /> */}
				{/* </aside> */}
				<div className="flex flex-col items-center border-x">
					{firstArticle && (
						<div className="relative flex w-full">
							<ArticleTeaser
								article={firstArticle}
								className="[&_[data-card='']]:text-background aspect-[16/7] h-full w-full [&_[data-card='']]:bg-gradient-to-tr [&_[data-card='']]:from-[#3E75FE]  [&_[data-card='']]:to-purple-500 [&_[data-card='']]:p-8 [&_[data-card='']]:sm:p-10 sm:[&_[data-title='']]:text-3xl"
							/>
							{ability.can('update', 'Content') ? (
								<Button
									asChild
									className="text-primary absolute bottom-3 right-3 scale-75 gap-1 bg-white shadow hover:bg-gray-50 sm:bottom-8 sm:right-8 sm:scale-100"
								>
									<Link href={`/articles/new`}>
										<FilePlus2 className="h-4 w-4" />
										New Article
									</Link>
								</Button>
							) : null}
						</div>
					)}
					<ul className="divide-border relative grid grid-cols-1 justify-center divide-y sm:grid-cols-2">
						{/* X borders */}
						{/* <div
								className="before:border-border pointer-events-none absolute left-0 top-0 hidden h-full w-full border-r before:absolute before:left-0 before:top-0 before:h-full before:w-1/2 before:border-r before:content-[''] sm:block"
								aria-hidden
							/> */}
						{articles.slice(1, articles.length).map((article, i) => {
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
