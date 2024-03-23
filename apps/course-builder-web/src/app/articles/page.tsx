import * as React from 'react'
import Link from 'next/link'
import { getAbility } from '@/ability'
import { getArticles } from '@/lib/articles-query'
import { getServerAuthSession } from '@/server/auth'

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

export default async function ArticlesIndexPage() {
	const session = await getServerAuthSession()
	const ability = getAbility({ user: session?.user })
	const articles = await getArticles()

	return (
		<div>
			{ability.can('update', 'Content') ? (
				<div className="bg-muted flex h-9 w-full items-center justify-between px-1">
					<div />
					<Button asChild className="h-7">
						<Link href={`/articles/new`}>New Article</Link>
					</Button>
				</div>
			) : null}
			<div className="flex flex-col space-y-4 p-5 sm:p-10">
				<h2 className="text-lg font-bold">Articles</h2>
				{articles.map((article) => (
					<Card key={article.id}>
						<CardHeader>
							<CardTitle>
								<Link href={`/${article.slug || article.id}`}>
									{article.title}
								</Link>
							</CardTitle>
						</CardHeader>
						<CardContent></CardContent>
					</Card>
				))}
			</div>
		</div>
	)
}
