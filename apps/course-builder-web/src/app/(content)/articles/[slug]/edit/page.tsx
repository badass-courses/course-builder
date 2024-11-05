import * as React from 'react'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { EditArticleForm } from '@/app/(content)/articles/_components/edit-article-form'
import { getArticle } from '@/lib/articles-query'
import { getServerAuthSession } from '@/server/auth'

export const dynamic = 'force-dynamic'

export default async function ArticleEditPage(props: {
	params: Promise<{ slug: string }>
}) {
	const params = await props.params
	await headers()
	const { ability } = await getServerAuthSession()
	const article = await getArticle(params.slug)

	if (!article || !ability.can('create', 'Content')) {
		notFound()
	}

	return <EditArticleForm key={article.fields.slug} article={article} />
}
