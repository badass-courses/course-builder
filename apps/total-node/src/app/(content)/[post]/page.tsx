import * as React from 'react'
import { Suspense } from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Contributor } from '@/app/_components/contributor'
import { PricingWidget } from '@/app/_components/home-pricing-widget'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import { type Post } from '@/lib/posts'
import { getPost } from '@/lib/posts-query'
import { getPricingProps } from '@/lib/pricing-query'
import { getServerAuthSession } from '@/server/auth'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { codeToHtml } from '@/utils/shiki'
import { CK_SUBSCRIBER_KEY } from '@skillrecordings/config'
import { MDXRemote } from 'next-mdx-remote/rsc'

import { Button } from '@coursebuilder/ui'

type Props = {
	params: { post: string }
	searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
	{ params, searchParams }: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const post = await getPost(params.post)

	if (!post) {
		return parent as Metadata
	}

	return {
		title: post.fields.title,
		openGraph: {
			images: [
				getOGImageUrlForResource({
					fields: { slug: post.fields.slug },
					id: post.id,
					updatedAt: post.updatedAt,
				}),
			],
		},
	}
}

async function PostActionBar({
	postLoader,
}: {
	postLoader: Promise<Post | null>
}) {
	const { session, ability } = await getServerAuthSession()
	const post = await postLoader

	return (
		<>
			{post && ability.can('update', 'Content') ? (
				<Button asChild size="sm">
					<Link href={`/posts/${post.fields?.slug || post.id}/edit`}>Edit</Link>
				</Button>
			) : null}
		</>
	)
}

async function Post({ postLoader }: { postLoader: Promise<Post | null> }) {
	const post = await postLoader

	if (!post) {
		notFound()
	}

	return (
		<article className="prose sm:prose-lg mt-10 max-w-none border-t pt-10">
			{post.fields.body && (
				<MDXRemote
					source={post.fields.body}
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

async function PostTitle({ postLoader }: { postLoader: Promise<Post | null> }) {
	const post = await postLoader

	return (
		<h1 className="fluid-3xl mb-4 inline-flex font-bold">
			{post?.fields?.title}
		</h1>
	)
}

export default async function PostPage({
	params,
	searchParams,
}: {
	params: { post: string }
	searchParams: { [key: string]: string | undefined }
}) {
	const postLoader = getPost(params.post)
	const cookieStore = cookies()
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
						href="/posts"
						className="text-primary mb-3 inline-flex text-sm hover:underline"
					>
						← Posts
					</Link>
					<Suspense fallback={null}>
						<PostActionBar postLoader={postLoader} />
					</Suspense>
				</div>
				<article>
					<PostTitle postLoader={postLoader} />
					<Contributor />
					<Post postLoader={postLoader} />
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
