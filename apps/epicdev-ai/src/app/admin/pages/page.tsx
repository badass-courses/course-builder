import * as React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import LayoutClient from '@/components/layout-client'
import { Page } from '@/lib/pages'
import { getPages } from '@/lib/pages-query'
import type { Post } from '@/lib/posts'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { format } from 'date-fns'
import { ChevronRight, FilePlus2, FileText, Pencil } from 'lucide-react'

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
		<main className="flex w-full justify-between p-10">
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
				<div className="mb-5 flex w-full items-center justify-between">
					<h1 className="fluid-3xl font-heading font-bold">Pages</h1>
					<Button asChild className="gap-1">
						<Link href={`/admin/pages/new`}>
							<FilePlus2 className="h-4 w-4" />
							New Page
						</Link>
					</Button>
				</div>
				<ul className="divide-border flex flex-col divide-y">
					{allPages.map((page, i) => {
						return <PageTeaser i={i} page={page} key={page.id} />
					})}
				</ul>
			</div>
		</main>
	)
}

const PageTeaser: React.FC<{
	page: Page
	i?: number
	className?: string
}> = ({ page, className, i }) => {
	const title = page.fields.title
	const description = page.fields.description
	const path = page.fields.path
	const createdAt = page.createdAt

	return (
		<li className={cn('', className)}>
			<Link
				href={`/admin/pages/${page.fields.slug}/edit`}
				passHref
				className="hover:bg-card flex w-full flex-col items-start justify-between gap-5 p-5 transition ease-in-out sm:flex-row"
				prefetch
			>
				<FileText className="text-primary relative size-5 flex-shrink-0 translate-y-0.5" />
				<div className="w-full">
					<div className="fluid-lg flex w-full flex-wrap items-baseline gap-1 font-semibold">
						{title}{' '}
						{path && (
							<code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
								{path}
							</code>
						)}
					</div>
					{description && (
						<div className="text-muted-foreground mt-3 text-sm">
							{description}
						</div>
					)}
				</div>
				<div className="hidden sm:flex">
					<ChevronRight className="text-primary size-4" />
				</div>
			</Link>
		</li>
	)
}
