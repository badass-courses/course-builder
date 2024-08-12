import * as React from 'react'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import { courseBuilderAdapter } from '@/db'
import { getArticle } from '@/lib/articles-query'
import { getServerAuthSession } from '@/server/auth'
import { ImagePlusIcon } from 'lucide-react'

import { EditArticleForm } from '../../_components/edit-article-form'

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

	const resource = article.resources?.[0]?.resource.id

	const videoResourceLoader = courseBuilderAdapter.getVideoResource(resource)
	const initialVideoResourceId = article.resources?.find((resourceJoin) => {
		return resourceJoin.resource.type === 'videoResource'
	})?.resource.id

	return (
		<EditArticleForm
			key={article.fields.slug}
			article={article}
			initialVideoResourceId={initialVideoResourceId}
			videoResourceLoader={videoResourceLoader}
		/>
	)
}
