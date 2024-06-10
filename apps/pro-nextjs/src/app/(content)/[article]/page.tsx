import * as React from 'react'
import { Suspense } from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Contributor } from '@/app/_components/contributor'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import { type Article } from '@/lib/articles'
import { getArticle } from '@/lib/articles-query'
import { getServerAuthSession } from '@/server/auth'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { codeToHtml } from '@/utils/shiki'
import { CK_SUBSCRIBER_KEY } from '@skillrecordings/config'
import { MDXRemote } from 'next-mdx-remote/rsc'

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

	if (!article) {
		return parent as Metadata
	}

	return {
		title: article.fields.title,
		// openGraph: { images: [getOGImageUrlForResource(article)] },
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
				<Button asChild size="sm">
					<Link href={`/articles/${article.fields?.slug || article.id}/edit`}>
						Edit
					</Link>
				</Button>
			) : null}
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
		<article className="prose sm:prose-lg mt-10 max-w-none border-t pt-10">
			{article.fields.body && (
				<MDXRemote
					source={article.fields.body}
					components={{
						pre: async (props: any) => {
							const children = props?.children.props.children
							const language =
								props?.children.props.className?.split('-')[1] || 'typescript'
							try {
								const html = await codeToHtml({ code: children, language })
								return <div dangerouslySetInnerHTML={{ __html: html }} />
							} catch (error) {
								console.error(error)
								return <pre {...props} />
							}
						},
					}}
				/>
			)}
		</article>
	)
}

async function ArticleTitle({
	articleLoader,
}: {
	articleLoader: Promise<Article | null>
}) {
	const article = await articleLoader

	return (
		<h1 className="fluid-3xl mb-4 inline-flex font-bold">
			{article?.fields?.title}
		</h1>
	)
}

export default async function ArticlePage({
	params,
}: {
	params: { article: string }
}) {
	const articleLoader = getArticle(params.article)
	const cookieStore = cookies()
	const ckSubscriber = cookieStore.has(CK_SUBSCRIBER_KEY)

	return (
		<main>
			<div className="container max-w-4xl pb-24 pt-10">
				<div className="flex w-full items-center justify-between">
					<Link
						href="/articles"
						className="text-primary mb-3 inline-flex text-sm hover:underline sm:text-base"
					>
						← Articles
					</Link>
					<Suspense fallback={null}>
						<ArticleActionBar articleLoader={articleLoader} />
					</Suspense>
				</div>
				<article>
					<ArticleTitle articleLoader={articleLoader} />
					<Contributor />
					<Article articleLoader={articleLoader} />
				</article>
			</div>
			{!ckSubscriber && <PrimaryNewsletterCta />}
		</main>
	)
}
