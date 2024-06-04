import * as React from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { env } from '@/env.mjs'
import { type Article } from '@/lib/articles'
import { getArticle } from '@/lib/articles-query'
import MDX from '@/mdx/mdx'
import serializeMDX from '@/mdx/serialize-mdx'
import { getServerAuthSession } from '@/server/auth'
import { ArticleJsonLd } from 'next-seo'
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

	return (
		<>
			{article && ability.can('update', 'Content') ? (
				<div className="bg-muted flex h-9 w-full items-center justify-between px-1">
					<div />
					<Button asChild size="sm">
						<Link href={`/articles/${article.fields?.slug || article.id}/edit`}>
							Edit
						</Link>
					</Button>
				</div>
			) : (
				<div className="bg-muted flex h-9 w-full items-center justify-between px-1" />
			)}
		</>
	)
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

	const articleBodySerialized = await serializeMDX(article.fields.body, {
		syntaxHighlighterOptions: {
			theme: 'material-palenight',
			showCopyButton: true,
		},
	})

	const jsonld: WithContext<ArticleJsonLD> = {
		'@context': 'https://schema.org',
		'@type': 'Article',
		name: article.fields.title,
		author: {
			'@type': 'Person',
			name:
				article.contributions.find((c) => c.contributionType.slug === 'author')
					?.user?.name || 'unknown',
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
			<main className="invert-svg prose dark:prose-invert md:prose-xl prose-code:break-words prose-pre:bg-gray-900 prose-pre:leading-relaxed md:prose-code:break-normal mx-auto w-full max-w-3xl px-5 py-8 md:py-16">
				<MDX contents={articleBodySerialized} />
			</main>
		</>
	)
}

async function ArticleTitle({
	articleLoader,
}: {
	articleLoader: Promise<Article | null>
}) {
	const article = await articleLoader

	return (
		<h1 className="text-3xl font-bold sm:text-4xl">{article?.fields?.title}</h1>
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
			<article className="mx-auto flex w-full max-w-screen-lg flex-col px-5 py-10 md:py-16">
				<ArticleTitle articleLoader={articleLoader} />
				<Article articleLoader={articleLoader} />
			</article>
		</div>
	)
}
