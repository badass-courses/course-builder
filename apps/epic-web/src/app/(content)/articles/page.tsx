import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ResourceContributor from '@/app/(content)/[article]/_components/resource-contributor'
import { getArticles } from '@/lib/articles-query'
import { getServerAuthSession } from '@/server/auth'
import slugify from '@sindresorhus/slugify'
import readingTime from 'reading-time'

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

export default async function ArticlesIndexPage() {
	const { ability } = await getServerAuthSession()
	const articles = await getArticles()
	const title = 'Epic Web Dev Articles'
	const pageDescription = 'Articles about Web Development'

	console.log({ articles })

	return (
		<>
			{ability.can('update', 'Content') ? (
				<div className="bg-muted flex h-9 w-full items-center justify-between px-1">
					<div />
					<Button asChild className="h-7">
						<Link href={`/articles/new`}>New Article</Link>
					</Button>
				</div>
			) : null}
			<header className="mx-auto w-full max-w-screen-lg px-5 pb-3 pt-5 sm:pb-5 sm:pt-8">
				<h1 className="text-lg font-semibold">{title}</h1>
			</header>
			<main className="mx-auto w-full max-w-screen-lg">
				<div className="grid w-full grid-cols-1 flex-col gap-5 px-5 pb-10 sm:grid-cols-2 lg:gap-10">
					{articles.map((article) => {
						const {
							fields: { title, image, slug, description, body },
						} = article
						const author = article.contributions.find(
							(c) => c.contributionType.slug === 'author',
						)?.user
						const estimatedReadingTime = readingTime(body || '')
						return (
							<article key={slug}>
								<Link
									href={slug}
									passHref
									// TODO - track links in server components
									// onClick={() => {
									// 	track('clicked start reading article', {
									// 		article: slug,
									// 	})
									// }}
									className="dark:bg-background group relative flex h-full w-full flex-col overflow-hidden rounded-lg bg-white shadow-2xl shadow-gray-500/20 transition hover:bg-gray-50 dark:shadow-none dark:hover:bg-gray-900/40"
								>
									{image?.url && (
										<div className="relative aspect-video h-full">
											<Image
												src={image.url}
												className="object-cover"
												alt=""
												fill
												priority
												sizes="(max-width: 768px) 418px, (max-width: 1200px) 418px, 280px"
											/>
										</div>
									)}
									<div className="flex h-full flex-col justify-between rounded-b-lg border-x border-b border-transparent px-5 py-8 md:px-8 dark:border-gray-900">
										<div className="relative z-10">
											<h2 className="text-2xl font-bold">{title}</h2>
											{description && (
												<p className="line-clamp-3 w-full pt-3 text-gray-600 dark:text-gray-400">
													{description}
												</p>
											)}
										</div>
										<div className="relative z-10 flex w-full flex-col items-start justify-between space-y-10 pt-8 md:flex-row md:items-center md:space-y-0">
											<div className="flex w-full items-center gap-10 text-sm text-gray-700 dark:text-gray-300">
												<ResourceContributor
													as="div"
													name={author?.name || 'unknown'}
													slug={slugify(author?.name || 'unknown')}
													image={author?.image}
													byline="Written by"
													className="text-sm font-normal text-gray-700 dark:text-gray-300 [&_span]:font-bold"
												/>
												<div>
													<div className="block font-bold">Time to read</div>~{' '}
													{estimatedReadingTime.minutes.toFixed(0)} minutes
												</div>
											</div>
										</div>
									</div>
								</Link>
							</article>
						)
					})}
				</div>
			</main>
		</>
	)
}
