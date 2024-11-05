import * as React from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { type Article } from '@/lib/articles'
import { getArticle } from '@/lib/articles-query'
import { getServerAuthSession } from '@/server/auth'
import ReactMarkdown from 'react-markdown'

import { Button } from '@coursebuilder/ui'

type Props = {
	params: Promise<{ article: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
	props: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params
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

	if (!article) {
		notFound()
	}

	return (
		<div className="flex flex-col gap-10 pt-10 md:flex-row md:gap-16 md:pt-16">
			<ReactMarkdown className="prose dark:prose-invert sm:prose-lg max-w-none">
				{article.fields?.body}
			</ReactMarkdown>
			{article.fields?.description && (
				<aside className="prose dark:prose-invert prose-sm mt-3 flex w-full flex-shrink-0 flex-col gap-3 md:max-w-[280px]">
					<div className="border-t pt-5">
						<strong>Description</strong>
						<ReactMarkdown>{article.fields?.description}</ReactMarkdown>
					</div>
				</aside>
			)}
		</div>
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

export default async function ArticlePage(props: {
	params: Promise<{ article: string }>
}) {
	const params = await props.params
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
