import * as React from 'react'
import { Suspense } from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArticleCTA } from '@/app/(content)/[article]/_components/article-cta'
import ResourceContributor from '@/app/(content)/[article]/_components/resource-contributor'
import ContributorBio from '@/components/contributor-bio'
import FloatingActionsBar from '@/components/floating-actions-bar'
import Share from '@/components/share'
import { env } from '@/env.mjs'
import { type Article } from '@/lib/articles'
import { getArticle } from '@/lib/articles-query'
import MDX from '@/mdx/mdx'
import serializeMDX from '@/mdx/serialize-mdx'
import { getServerAuthSession } from '@/server/auth'
import slugify from '@sindresorhus/slugify'
import { format } from 'date-fns'
import readingTime from 'reading-time'
import { Article as ArticleJsonLD, WithContext } from 'schema-dts'

import { Button } from '@coursebuilder/ui'

type Props = {
	params: { article: string }
	searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
	{ params, searchParams }: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const article = await getArticle(params.article)

	return {
		title: article?.fields.title,
	}
}

async function ArticleActionBar({
	articleLoader,
}: {
	articleLoader: Promise<Article | null>
}) {
	const { session, ability } = await getServerAuthSession()
	const article = await articleLoader

	return article && ability.can('update', 'Content') ? (
		<FloatingActionsBar>
			<Button asChild size="sm">
				<Link href={`/articles/${article.fields?.slug || article.id}/edit`}>
					Edit
				</Link>
			</Button>
		</FloatingActionsBar>
	) : null
}

async function Article({
	articleLoader,
}: {
	articleLoader: Promise<Article | null>
}) {
	const article = await articleLoader

	if (!article?.fields?.body) {
		notFound()
	}

	const estimatedReadingTime = readingTime(article.fields.body)

	const articleBodySerialized = await serializeMDX(article.fields.body, {
		syntaxHighlighterOptions: {
			theme: 'material-palenight',
			showCopyButton: true,
		},
	})

	const author = article.contributions.find(
		(c) => c.contributionType.slug === 'author',
	)?.user

	const jsonld: WithContext<ArticleJsonLD> = {
		'@context': 'https://schema.org',
		'@type': 'Article',
		name: article.fields.title,
		author: {
			'@type': 'Person',
			name: author?.name || 'unknown',
		},
		datePublished: article.createdAt?.toISOString() || new Date().toISOString(),
		dateModified: article.updatedAt?.toISOString() || new Date().toISOString(),
		description: article.fields.description,
		image: article.fields.image?.url,
		url: `${env.NEXT_PUBLIC_URL}/${article.fields.slug}`,
	}

	return (
		<>
			<script async src="https://platform.twitter.com/widgets.js" />
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }}
			/>
			<Header
				article={article}
				estimatedReadingTime={Number(estimatedReadingTime.minutes.toFixed(0))}
			/>
			<main className="invert-svg prose dark:prose-invert md:prose-xl prose-code:break-words prose-pre:bg-gray-900 prose-pre:leading-relaxed md:prose-code:break-normal mx-auto w-full max-w-3xl px-5 py-8 md:py-16">
				<MDX contents={articleBodySerialized} />
			</main>
			<Share
				contributor={author}
				title={article.fields.title}
				path={`/${article.fields.slug}`}
			/>
			<ContributorBio
				slug={slugify(author?.name || 'unknown')}
				name={author?.name || 'unknown'}
				picture={
					author?.image
						? {
								url: author?.image,
								alt: author?.name || 'unknown',
							}
						: null
				}
				title={(name) => `Written by ${name}`}
				bio={'bio to be added'}
				className="sm:py-10"
			/>

			<Suspense>
				<ArticleCTA article={article} />
			</Suspense>
		</>
	)
}

const Header = ({
	article,
	estimatedReadingTime,
}: {
	article: Article
	estimatedReadingTime: number
}) => {
	const { updatedAt } = article
	const { title, image } = article.fields
	const author = article.contributions.find(
		(c) => c.contributionType.slug === 'author',
	)?.user

	return (
		<div className="bg-[radial-gradient(ellipse_at_top,#EAEBFF_0%,transparent_65%)] dark:bg-[radial-gradient(ellipse_at_top,#1a1e2c_0%,transparent_65%)]">
			<header className="relative mx-auto w-full max-w-screen-lg">
				<div className="relative flex w-full flex-col items-center justify-center pb-14 pt-24 sm:pb-24 sm:pt-32">
					<div className="flex flex-grow items-center justify-center">
						<h1 className="fluid-3xl sm:fluid-3xl w-full max-w-screen-xl px-5 text-center font-semibold tracking-tight md:font-bold">
							{title}
						</h1>
					</div>
				</div>
				{image?.url && article.fields.slug === 'epic-stack' && (
					<div className="bg-foreground/5 relative flex aspect-video h-full w-full items-center justify-center overflow-hidden sm:rounded-lg">
						<Image
							src={image.url}
							priority
							alt=""
							aria-hidden="true"
							quality={100}
							fill
						/>
						<iframe
							className="absolute h-[calc(100%-32px)] w-[calc(100%-32px)] rounded-md shadow-2xl shadow-black/50"
							src={`https://www.youtube.com/embed/yMK5SVRASxM?autoplay=1&origin=${process.env.NEXT_PUBLIC_URL}`}
						/>
					</div>
				)}
				<div className="mx-auto flex w-full max-w-3xl flex-row justify-center gap-5 px-5 pt-8 text-base text-gray-700 sm:items-center sm:justify-between sm:gap-10 sm:text-base md:gap-16 lg:px-5 dark:text-gray-300">
					<ResourceContributor
						className="col-span-2 flex-shrink-0 text-base sm:text-lg [&_span]:font-mono [&_span]:text-xs [&_span]:font-semibold [&_span]:uppercase [&_span]:opacity-75"
						name={author?.name || 'unknown'}
						slug={slugify(author?.name || 'unknown')}
						image={author?.image}
						byline="Author"
					/>
					<div className="hidden items-center justify-start gap-8 text-left text-sm sm:flex sm:justify-end sm:gap-16 sm:text-base">
						<div className="flex flex-shrink-0 flex-col justify-center font-semibold sm:w-auto">
							<span className=" font-mono text-xs font-semibold uppercase opacity-75">
								Reading time
							</span>
							~ {estimatedReadingTime} minutes
						</div>
						<div className="flex flex-shrink-0 flex-col justify-center font-semibold sm:w-auto">
							<span className=" font-mono text-xs font-semibold uppercase opacity-75">
								Published
							</span>
							{format(updatedAt || new Date(), 'dd MMMM, y')}
						</div>
					</div>
				</div>
			</header>
		</div>
	)
}

export default async function ArticlePage({
	params,
}: {
	params: { article: string }
}) {
	const articleLoader = getArticle(params.article)
	return (
		<div>
			<ArticleActionBar articleLoader={articleLoader} />
			<Article articleLoader={articleLoader} />
		</div>
	)
}
