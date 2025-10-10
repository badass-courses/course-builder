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
import { FilePlus2, FileText, Pencil } from 'lucide-react'

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
					<h1 className="font-heading text-xl font-bold sm:text-3xl">Pages</h1>
					<Button asChild className="gap-1">
						<Link href={`/admin/pages/new`}>
							<FilePlus2 className="h-4 w-4" />
							New Page
						</Link>
					</Button>
				</div>
				<ul className="divide-border flex flex-col divide-y">
					{allPages.map((page, i) => {
						return (
							<PageTeaser
								i={i}
								article={page}
								key={page.id}
								className="flex w-full items-center py-4"
							/>
						)
					})}
				</ul>
			</div>
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
		<li className={cn('', className)}>
			<Link
				href={`/admin/pages/${article.fields.slug}/edit`}
				passHref
				className="flex w-full items-center gap-3 py-5 text-lg"
			>
				<FileText className="text-muted-foreground h-4 w-4" /> {title}
			</Link>
		</li>
	)
}
