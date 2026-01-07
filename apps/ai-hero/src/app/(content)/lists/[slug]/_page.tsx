// Used for root route /[post]

import * as React from 'react'
import { Suspense } from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Contributor } from '@/components/contributor'
import { Share } from '@/components/share'
import type { List } from '@/lib/lists'
import { getAllLists, getList } from '@/lib/lists-query'
import { getServerAuthSession } from '@/server/auth'
import { compileMDX } from '@/utils/compile-mdx'
import { generateGridPattern } from '@/utils/generate-grid-pattern'
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

	const squareGridPattern = generateGridPattern(
		list.fields.title,
		1000,
		800,
		0.8,
		true,
	)

	const Links = ({ children }: { children?: React.ReactNode }) => {
		return (
			<div className="relative w-full grid-cols-6 items-center border-y md:grid">
				<div
					aria-hidden="true"
					className="via-foreground/10 to-muted bg-linear-to-r absolute -bottom-px right-0 h-px w-2/3 from-transparent"
				/>
				<div className="divide-border col-span-4 flex flex-wrap items-center divide-y md:divide-y-0">
					<div className="bg-stripes h-14 sm:w-8 lg:w-10" />
					{firstResource?.fields?.slug && (
						<Button
							size="lg"
							className="before:bg-primary-foreground relative h-14 w-full rounded-none text-base font-medium before:absolute before:-left-1 before:h-2 before:w-2 before:rotate-45 before:content-[''] sm:max-w-[180px]"
							asChild
						>
							<Link href={firstResourceHref}>
								Start Learning
								{/* <ChevronRight className="ml-2 w-4" /> */}
							</Link>
						</Button>
					)}
					<div
						className={cn('w-full items-center sm:flex sm:w-auto', {
							'grid grid-cols-2': list?.fields?.github,
						})}
					>
						{list?.fields?.github && (
							<Button
								className="h-14 w-full rounded-none border-r px-5 md:w-auto"
								variant="ghost"
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
									className="h-14 w-full rounded-none px-5 md:w-auto md:border-r"
									variant="ghost"
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
				{children}
			</div>
		)
	}

	return (
		<main className="flex min-h-screen w-full flex-col">
			<header className="relative flex items-center justify-center md:px-8 lg:px-10">
				<div className="relative z-10 mx-auto flex h-full w-full flex-col-reverse items-center justify-between gap-5 pb-10 md:grid md:grid-cols-5 md:gap-10 md:pt-10 lg:gap-5">
					<div className="col-span-3 flex shrink-0 flex-col items-center gap-3 px-5 md:items-start md:px-0">
						<h1 className="w-full text-center text-2xl font-semibold sm:text-3xl md:text-left lg:text-4xl xl:text-5xl dark:text-white">
							{list.fields.title}
						</h1>
						{list.fields.description && (
							<div className="prose prose-p:text-balance dark:prose-invert md:prose-p:text-left prose-p:text-center prose-p:font-normal sm:prose-lg lg:prose-lg">
								<p>{list.fields.description}</p>
							</div>
						)}
						<div className="flex items-center gap-2">
							<Contributor />
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
									className="brightness-100 transition duration-300 ease-in-out group-hover:brightness-100 sm:rounded dark:brightness-90"
									sizes="(max-width: 768px) 100vw, 480px"
								/>
								<div className="bg-background/80 absolute bottom-5 right-5 flex items-center justify-center rounded-full p-2 backdrop-blur-md transition ease-out group-hover:scale-110">
									<PlayIcon className="relative h-5 w-5 translate-x-px" />
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
						className="object-top-right hidden h-[320px] w-full overflow-hidden object-cover opacity-[0.05] saturate-0 sm:flex dark:opacity-[0.15]"
					/>
					<div
						className="to-background via-background bg-linear-to-bl absolute left-0 top-0 z-10 h-full w-full from-transparent"
						aria-hidden="true"
					/>
				</div>
			</header>
			<Links>
				<div className="col-span-2 hidden h-14 items-center border-l pl-5 text-base font-medium md:flex">
					Content
				</div>
			</Links>
			<div className="">
				<div className="mx-auto flex w-full grid-cols-6 flex-col md:grid">
					<article className="prose sm:prose-lg lg:prose-lg prose-p:max-w-4xl dark:prose-invert prose-headings:max-w-4xl prose-ul:max-w-4xl prose-table:max-w-4xl prose-pre:max-w-4xl **:data-pre:max-w-4xl col-span-4 max-w-none px-5 py-10 sm:px-8 lg:px-10">
						{body || 'No body found.'}
					</article>
					<ListResources list={list} />
				</div>
			</div>
			<Links />
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
