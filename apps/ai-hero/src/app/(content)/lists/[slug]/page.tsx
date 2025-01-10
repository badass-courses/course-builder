import * as React from 'react'
import { Suspense } from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Contributor } from '@/app/_components/contributor'
import { Share } from '@/components/share'
import type { List } from '@/lib/lists'
import { getAllLists, getList } from '@/lib/lists-query'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { recmaCodeHike, remarkCodeHike } from 'codehike/mdx'
import { ArrowRight } from 'lucide-react'
import { compileMDX } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'

import { Button } from '@coursebuilder/ui'

type Props = {
	params: Promise<{ slug: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateStaticParams() {
	const lists = await getAllLists()

	return lists
		.filter((list) => Boolean(list.fields?.slug))
		.map((list) => ({
			slug: list.fields?.slug,
		}))
}

export async function generateMetadata(
	props: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params
	const list = await getList(params.slug)

	if (!list) {
		return parent as Metadata
	}

	return {
		title: list.fields.title,
		openGraph: {
			images: [
				getOGImageUrlForResource({
					fields: { slug: list.fields.slug },
					id: list.id,
					updatedAt: list.updatedAt,
				}),
			],
		},
	}
}

export default async function ListPage(props: {
	params: Promise<{ slug: string }>
	searchParams: Promise<{ [key: string]: string | undefined }>
}) {
	const searchParams = await props.searchParams
	const params = await props.params
	const list = await getList(params.slug).catch(() => notFound())

	let body

	if (list.fields.body) {
		const { content } = await compileMDX({
			source: list.fields.body,
			// @ts-expect-error
			components: { Code, Scrollycoding },
			options: {
				mdxOptions: {
					remarkPlugins: [
						remarkGfm,
						[
							remarkCodeHike,
							{
								components: { code: 'Code' },
							},
						],
					],
					recmaPlugins: [
						[
							recmaCodeHike,
							{
								components: { code: 'Code' },
							},
						],
					],
				},
			},
		})
		body = content
	}

	const firstResource = list.resources?.[0]?.resource

	return (
		<main className="min-h-screen w-full pb-16">
			<header className="bg-muted/75 flex items-center justify-center px-5 pb-8 sm:px-8 sm:pb-0">
				<div className="mx-auto flex h-full w-full max-w-5xl flex-col items-center justify-between gap-5 lg:flex-row">
					<div className="flex flex-shrink-0 flex-col items-center gap-3 py-16 sm:items-start">
						<h1 className="fluid-3xl w-full text-center font-bold sm:text-left">
							{list.fields.title}
						</h1>
						{list.fields.description && (
							<div className="prose sm:prose-lg opacity-75">
								<p>{list.fields.description}</p>
							</div>
						)}
						<Contributor />
					</div>
					{firstResource && (
						<Button className="w-full max-w-[180px]" asChild>
							<Link href={`/${firstResource?.fields?.slug}`}>
								Start Learning <ArrowRight className="ml-1 h-4 w-4" />
							</Link>
						</Button>
					)}
				</div>
			</header>
			<div className="px-5 sm:px-8">
				<div className="mx-auto mt-10 flex w-full max-w-5xl flex-col gap-10 sm:grid md:grid-cols-5">
					<article className="prose sm:prose-lg lg:prose-xl prose-p:max-w-4xl prose-headings:max-w-4xl prose-ul:max-w-4xl prose-table:max-w-4xl prose-pre:max-w-4xl prose-p:text-foreground/80 col-span-3 max-w-none [&_[data-pre]]:max-w-4xl">
						{body || 'No description found.'}
					</article>
					<aside className="col-span-2">
						{list.resources && (
							<>
								<h3 className="fluid-xl mb-3 font-semibold">Content</h3>
								<ol className="divide-border flex flex-col divide-y">
									{list.resources.map(({ resource }, i) => (
										<li key={resource.id}>
											<Link
												className="hover:bg-muted flex items-center gap-3 px-2 py-2 transition"
												href={`/${resource.fields.slug}`}
											>
												<small className="min-w-[2ch] text-right font-mono text-xs opacity-60">
													{i + 1}
												</small>
												{resource.fields.title}
											</Link>
										</li>
									))}
								</ol>
							</>
						)}
					</aside>
				</div>
				<Share className="bg-background relative z-10 mx-auto w-full max-w-[285px] translate-y-24" />
			</div>
		</main>
	)
}
