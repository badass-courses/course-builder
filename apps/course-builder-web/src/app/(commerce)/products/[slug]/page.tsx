import * as React from 'react'
import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProduct } from '@/lib/products-query'
import { getServerAuthSession } from '@/server/auth'
import ReactMarkdown from 'react-markdown'

import { Product } from '@coursebuilder/core/schemas'
import { Button } from '@coursebuilder/ui'

async function PromptActionBar({
	productLoader,
}: {
	productLoader: Promise<Product | null>
}) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	const product = await productLoader

	if (!user || !ability.can('create', 'Content')) {
		notFound()
	}

	return (
		<>
			{product && ability.can('update', 'Content') ? (
				<div className="bg-muted flex h-9 w-full items-center justify-between px-1">
					<div />
					<Button asChild size="sm">
						<Link href={`/products/${product.fields?.slug || product.id}/edit`}>
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

async function ProductDetails({
	productLoader,
}: {
	productLoader: Promise<Product | null>
}) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	const product = await productLoader

	if (!product || !user || !ability.can('create', 'Content')) {
		notFound()
	}

	return (
		<div className="flex flex-col gap-10 pt-10 md:flex-row md:gap-16 md:pt-16">
			<ReactMarkdown className="prose dark:prose-invert sm:prose-lg max-w-none">
				{product.fields?.body}
			</ReactMarkdown>
			{product.fields?.description && (
				<aside className="prose dark:prose-invert prose-sm mt-3 flex w-full flex-shrink-0 flex-col gap-3 md:max-w-[280px]">
					<div className="border-t pt-5">
						<strong>Description</strong>
						<ReactMarkdown>{product.fields?.description}</ReactMarkdown>
					</div>
				</aside>
			)}
		</div>
	)
}

async function ProductTitle({
	productLoader,
}: {
	productLoader: Promise<Product | null>
}) {
	const product = await productLoader

	return (
		<h1 className="text-3xl font-bold sm:text-4xl">{product?.fields?.title}</h1>
	)
}

export default async function ProductPage({
	params,
}: {
	params: { slug: string }
}) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user || !ability.can('create', 'Content')) {
		notFound()
	}

	const productLoader = getProduct(params.slug)

	return (
		<div>
			<Suspense
				fallback={
					<div className="bg-muted flex h-9 w-full items-center justify-between px-1" />
				}
			>
				<PromptActionBar productLoader={productLoader} />
			</Suspense>
			<article className="mx-auto flex w-full max-w-screen-lg flex-col px-5 py-10 md:py-16">
				<ProductTitle productLoader={productLoader} />
				<ProductDetails productLoader={productLoader} />
			</article>
		</div>
	)
}
