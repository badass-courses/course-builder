import * as React from 'react'
import { Suspense } from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Contributor } from '@/app/_components/contributor'
import { PricingWidget } from '@/app/_components/home-pricing-widget'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import { type Article } from '@/lib/articles'
import { getArticle } from '@/lib/articles-query'
import { getPricingProps } from '@/lib/pricing-query'
import { getServerAuthSession } from '@/server/auth'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { codeToHtml } from '@/utils/shiki'
import { CK_SUBSCRIBER_KEY } from '@skillrecordings/config'
import { MDXRemote } from 'next-mdx-remote/rsc'

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

	if (!article) {
		return parent as Metadata
	}

	return {
		title: article.fields.title,
		openGraph: {
			images: [
				getOGImageUrlForResource({
					fields: { slug: article.fields.slug },
					id: article.id,
					updatedAt: article.updatedAt,
				}),
			],
		},
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
						// @ts-expect-error
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

export default async function ArticlePage(props: {
	params: Promise<{ article: string }>
	searchParams: Promise<{ [key: string]: string | undefined }>
}) {
	const searchParams = await props.searchParams
	const params = await props.params
	const articleLoader = getArticle(params.article)
	const cookieStore = await cookies()
	const ckSubscriber = cookieStore.has(CK_SUBSCRIBER_KEY)
	const { allowPurchase, pricingDataLoader, product, commerceProps } =
		ckSubscriber
			? await getPricingProps({ searchParams })
			: {
					allowPurchase: false,
					pricingDataLoader: null,
					product: null,
					commerceProps: null,
				}

	return (
		<main>
			<div className="container max-w-4xl pb-24 pt-10">
				<div className="flex w-full items-center justify-between">
					<Link
						href="/articles"
						className="text-primary mb-3 inline-flex text-sm hover:underline"
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
			{ckSubscriber && product && allowPurchase && pricingDataLoader ? (
				<section id="buy">
					<h2 className="fluid-2xl mb-10 text-balance px-5 text-center font-bold">
						Get Really Good At Next.js
					</h2>
					<div className="flex items-center justify-center border-y">
						<div className="bg-background flex w-full max-w-md flex-col border-x p-8">
							<PricingWidget
								quantityAvailable={-1}
								pricingDataLoader={pricingDataLoader}
								commerceProps={{ ...commerceProps }}
								product={product}
							/>
						</div>
					</div>
				</section>
			) : (
				<PrimaryNewsletterCta />
			)}
		</main>
	)
}
