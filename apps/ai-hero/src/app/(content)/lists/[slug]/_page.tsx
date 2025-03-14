// Used for root route /[post]

import * as React from 'react'
import { Suspense } from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import { cookies } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Testimonial } from '@/app/admin/pages/_components/page-builder-mdx-components'
import { Code } from '@/components/codehike/code'
import Scrollycoding from '@/components/codehike/scrollycoding'
import { Contributor } from '@/components/contributor'
import LayoutClient from '@/components/layout-client'
import { Share } from '@/components/share'
import type { List } from '@/lib/lists'
import { getAllLists, getList } from '@/lib/lists-query'
import { getServerAuthSession } from '@/server/auth'
import { track } from '@/utils/analytics'
import { generateGridPattern } from '@/utils/generate-grid-pattern'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { PlayIcon } from '@heroicons/react/24/solid'
import { recmaCodeHike, remarkCodeHike } from 'codehike/mdx'
import { ChevronRight, Github, Play, Share2 } from 'lucide-react'
import { compileMDX } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'

import {
	Button,
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

import ListResources from '../_components/list-resources'

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
		description: list.fields.description,
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
	list: List
	params: Promise<{ slug: string }>
	searchParams: Promise<{ [key: string]: string | undefined }>
}) {
	const list = props.list
	let body

	if (list.fields.body) {
		const { content } = await compileMDX({
			source: list.fields.body,
			// @ts-expect-error
			components: { Code, Scrollycoding, Testimonial },
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
	const firstResourceHref = `/${firstResource?.fields?.slug}?list=${list.fields.slug}`

	const squareGridPattern = generateGridPattern(
		list.fields.title,
		1000,
		800,
		0.8,
		true,
	)

	return (
		<main className="flex min-h-screen w-full flex-col pb-16">
			<header className="relative flex items-center justify-center px-5 pb-8 sm:px-8 sm:pb-0">
				<div className="relative z-10 mx-auto flex h-full w-full max-w-5xl flex-col-reverse items-center justify-between gap-10 py-5 md:grid md:grid-cols-5 md:pb-10 md:pt-10 lg:gap-16">
					<div className="col-span-3 flex flex-shrink-0 flex-col items-center gap-3 md:items-start">
						<h1 className="fluid-3xl w-full text-center font-bold tracking-tight md:text-left">
							{list.fields.title}
						</h1>
						{list.fields.description && (
							<div className="prose prose-p:text-balance md:prose-p:text-left prose-p:text-center sm:prose-lg opacity-75">
								<p>{list.fields.description}</p>
							</div>
						)}
						<Contributor />
						<div className="mt-5 flex w-full flex-col flex-wrap items-center justify-center gap-1.5 sm:flex-row sm:gap-2 md:justify-start">
							{firstResource?.fields?.slug && (
								<Button size="lg" className="w-full sm:max-w-[180px]" asChild>
									<Link href={firstResourceHref}>
										Start Learning <ChevronRight className="ml-2 w-4" />
									</Link>
								</Button>
							)}
							{list?.fields?.github && (
								<Button
									className="w-full px-5 sm:w-auto"
									variant="outline"
									size="lg"
									asChild
								>
									<Link href={list.fields.github} target="_blank">
										<Github className="mr-2 w-3" /> Code
									</Link>
								</Button>
							)}
							<Dialog>
								<DialogTrigger asChild>
									<Button
										className="w-full px-5 sm:w-auto"
										variant="outline"
										size="lg"
									>
										<Share2 className="mr-2 w-3" /> Share
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogTitle>Share {list.fields.title}</DialogTitle>
									<Share className="" />
								</DialogContent>
							</Dialog>
						</div>
					</div>
					<div className="col-span-2">
						{firstResource && list.fields?.image && (
							<Link
								className="group relative flex items-center justify-center"
								href={firstResourceHref}
							>
								<Image
									priority
									alt={list.fields.title}
									src={list.fields.image}
									width={480}
									height={270}
									className="rounded brightness-90 transition duration-300 ease-in-out group-hover:brightness-100"
									sizes="(max-width: 768px) 100vw, 480px"
								/>
								<div className="bg-background/80 absolute flex items-center justify-center rounded-full p-2 backdrop-blur-md">
									<PlayIcon className="relative h-5 w-5 translate-x-[1px]" />
									<span className="sr-only">Start Learning</span>
								</div>
							</Link>
						)}
					</div>
					<Suspense fallback={null}>
						<ListActionBar className="absolute right-0 top-5" list={list} />
					</Suspense>
				</div>
				<div className={cn('absolute right-0 top-0 z-0 w-full', {})}>
					<img
						src={squareGridPattern}
						alt=""
						aria-hidden="true"
						className="hidden h-[320px] w-full overflow-hidden object-cover object-right-top opacity-[0.05] saturate-0 sm:flex dark:opacity-[0.15]"
					/>
					<div
						className="to-background via-background absolute left-0 top-0 z-10 h-full w-full bg-gradient-to-bl from-transparent"
						aria-hidden="true"
					/>
				</div>
			</header>
			<div className="px-5 sm:px-8">
				<div className="mx-auto mt-10 flex w-full max-w-5xl flex-col gap-10 sm:grid md:grid-cols-5 lg:gap-16">
					<article className="prose sm:prose-lg lg:prose-xl prose-p:max-w-4xl prose-headings:max-w-4xl prose-ul:max-w-4xl prose-table:max-w-4xl prose-pre:max-w-4xl col-span-3 max-w-none [&_[data-pre]]:max-w-4xl">
						{body || 'No body found.'}
					</article>
					<ListResources list={list} />
				</div>
			</div>
		</main>
	)
}

export async function ListActionBar({
	list,
	className,
}: {
	list: List | null
	className?: string
}) {
	const { session, ability } = await getServerAuthSession()

	return (
		<>
			{list && ability.can('update', 'Content') ? (
				<Button className={cn(className)} asChild variant="outline" size="sm">
					<Link href={`/lists/${list.fields?.slug || list.id}/edit`}>Edit</Link>
				</Button>
			) : null}
		</>
	)
}
