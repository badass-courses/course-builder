// Used for root route /[post]

import * as React from 'react'
import { Suspense } from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { CldImage } from '@/components/cld-image'
import { Contributor } from '@/components/contributor'
import { Share } from '@/components/share'
import type { List } from '@/lib/lists'
import { getAllLists, getList } from '@/lib/lists-query'
import { getServerAuthSession } from '@/server/auth'
import { compileMDX } from '@/utils/compile-mdx'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { PlayIcon } from '@heroicons/react/24/solid'
import { Github, Share2 } from 'lucide-react'

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
}) {
	const list = props.list
	let body

	if (list.fields.body) {
		const { content } = await compileMDX(list.fields.body)
		body = content
	}

	const firstResource = list.resources?.[0]?.resource
	const firstResourceHref = `/${firstResource?.fields?.slug}`

	const Links = ({ children }: { children?: React.ReactNode }) => {
		return (
			<div className="">
				{firstResource?.fields?.slug && (
					<Button size="lg" asChild>
						<Link href={firstResourceHref}>
							Start Learning
							{/* <ChevronRight className="ml-2 w-4" /> */}
						</Link>
					</Button>
				)}
				{list?.fields?.github && (
					<Button variant="ghost" size="lg" asChild>
						<Link href={list.fields.github} target="_blank">
							<Github className="mr-2 w-3" /> Code
						</Link>
					</Button>
				)}
				<Dialog>
					<DialogTrigger asChild>
						<Button variant="ghost" size="lg">
							<Share2 className="mr-2 w-3" /> Share
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogTitle>Share {list.fields.title}</DialogTitle>
						<Share className="" />
					</DialogContent>
				</Dialog>
				{children}
			</div>
		)
	}
	const fields = list.fields

	return (
		<div className="relative min-h-[calc(100svh-var(--nav-height))] pt-10">
			<div className="flex grid-cols-12 flex-col lg:grid lg:gap-16">
				<div className="col-span-8">
					<header className="flex w-full flex-col items-center justify-between md:gap-10 lg:flex-row">
						{fields?.image && (
							<CldImage
								className="flex w-full lg:hidden"
								width={383}
								height={204}
								src={fields?.image}
								alt={fields?.title}
							/>
						)}
						<div className="flex w-full flex-col items-center text-center md:items-start md:text-left">
							<p className="text-muted-foreground block pb-5 text-sm font-medium">
								Free Tutorial
							</p>
							<h1 className="text-balance text-3xl font-semibold sm:text-4xl lg:text-5xl">
								{fields.title}
							</h1>
							{fields.description && (
								<h2 className="text-muted-foreground mt-5 text-balance text-lg sm:text-xl">
									{fields.description}
								</h2>
							)}
							<div className="mt-8 flex flex-col gap-2">
								<span className="text-muted-foreground text-sm uppercase">
									Created by
								</span>
								<div className="border-border rounded-lg border px-5 pl-2">
									<Contributor
										imageSize={66}
										className="[&_div]:text-left"
										withBio
									/>
								</div>
							</div>
						</div>
						<Suspense fallback={null}>
							<ListActionBar className="absolute right-0 top-5" list={list} />
						</Suspense>
					</header>
					<article className="prose dark:prose-invert sm:prose-lg lg:prose-lg max-w-none py-10">
						{body || 'No tutorial body found.'}
					</article>
				</div>
				<ListResources list={list} />
			</div>
		</div>
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
