import * as React from 'react'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { EditArticleForm } from '@/app/articles/_components/edit-article-form'
import { getArticle } from '@/lib/articles-query'
import { getServerAuthSession } from '@/server/auth'

import { ContentResource } from '@coursebuilder/core/types'

export const dynamic = 'force-dynamic'

export default async function ArticleEditPage({
	params,
}: {
	params: { slug: string }
}) {
	headers()
	const { ability } = await getServerAuthSession()
	const article = await getArticle(params.slug)

	if (!article || !ability.can('create', 'Content')) {
		notFound()
	}

	return <EditArticleForm key={article.fields.slug} article={article} />
}
