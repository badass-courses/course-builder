import * as React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Page } from '@/lib/pages'
import { getPages } from '@/lib/pages-query'
import type { Post } from '@/lib/posts'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { format } from 'date-fns'
import { FilePlus2, Pencil } from 'lucide-react'

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

export default async function PagesIndexPage() {
	const { ability } = await getServerAuthSession()
	if (ability.cannot('manage', 'all')) {
		notFound()
	}

	const allPages = await getPages()

	return (
		<main className="container flex flex-col-reverse px-5 lg:flex-row">
			<div className="mx-auto flex w-full max-w-screen-lg flex-col sm:flex-row">
				<div className="flex flex-col items-center border-x">
					<ul className="divide-border relative grid grid-cols-1 justify-center divide-y sm:grid-cols-2">
						{allPages.slice(1, allPages.length).map((page, i) => {
							return (
								<PageTeaser
									i={i}
									article={page}
									key={page.id}
									className="[&_[data-card]]:pl-8 [&_[data-title='']]:transition [&_[data-title='']]:hover:text-blue-500"
								/>
							)
						})}
					</ul>
				</div>
			</div>
			<React.Suspense
				fallback={
					<aside className="hidden w-full max-w-xs border-r lg:block" />
				}
			>
				<ArticleListActions pages={allPages} />
			</React.Suspense>
		</main>
	)
}

const PageTeaser: React.FC<{
	article: Page
	i?: number
	className?: string
}> = ({ article, className, i }) => {
	const title = article.fields.title
	const description = article.fields.description
	const createdAt = article.createdAt

	return (
		<li className={cn('flex h-full', className)}>
			<Link href={`/${article.fields.slug}`} passHref className="flex w-full">
				<Card
					data-card=""
					className={cn(
						'mx-auto flex h-full w-full flex-col justify-between rounded-none border-0 bg-transparent p-8 shadow-none',
						{
							'sm:border-r': (i && i % 2 === 0) || i === 0,
						},
					)}
				>
					<div>
						<CardHeader className="p-0">
							<p className="pb-1.5 text-sm opacity-60">
								{createdAt && format(new Date(createdAt), 'MMMM do, y')}
							</p>
							<CardTitle
								data-title=""
								className="text-xl font-semibold leading-tight"
							>
								{title}
							</CardTitle>
						</CardHeader>
						{description && (
							<CardContent className="p-0">
								<p className="text-balance pt-4 text-sm opacity-75">
									{description}
								</p>
							</CardContent>
						)}
					</div>
				</Card>
			</Link>
		</li>
	)
}

async function ArticleListActions({ pages }: { pages?: Page[] }) {
	const { ability, session } = await getServerAuthSession()
	return ability.can('create', 'Content') ? (
		<aside className="w-full border-x lg:max-w-xs lg:border-l-0 lg:border-r">
			<div className="border-b p-5">
				<p className="font-semibold">
					Hey {session?.user?.name?.split(' ')[0] || 'there'}!
				</p>
				<p>
					You have <strong className="font-semibold">{pages?.length}</strong>{' '}
					unpublished pages.
				</p>
			</div>
			{pages ? (
				<ul className="flex flex-col px-5 pt-5">
					{pages.map((page) => {
						return (
							<li key={page.id}>
								<Link
									className="group flex flex-col py-2"
									href={`/admin/pages/${page.fields.slug}/edit`}
								>
									<strong className="group-hover:text-primary inline-flex items-baseline gap-1 font-semibold leading-tight transition">
										<Pencil className="text-muted-foreground h-3 w-3 flex-shrink-0" />
										<span>{page.fields.title}</span>
									</strong>
									<div className="text-muted-foreground pl-4 text-sm">
										{page.fields.state}
										{page.fields.state === 'published' &&
											` - ${page.fields.visibility}`}
									</div>
								</Link>
							</li>
						)
					})}
				</ul>
			) : null}
			{ability.can('update', 'Content') ? (
				<div className="p-5">
					<Button variant="outline" asChild className="w-full gap-1">
						<Link href={`/admin/pages/new`}>
							<FilePlus2 className="h-4 w-4" />
							New Page
						</Link>
					</Button>
				</div>
			) : null}
		</aside>
	) : (
		<aside className="hidden w-full max-w-xs border-r lg:block" />
	)
}
