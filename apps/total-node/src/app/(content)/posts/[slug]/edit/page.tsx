import * as React from 'react'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import { getPost } from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'
import { ImagePlusIcon } from 'lucide-react'

import { EditPostForm } from '../../_components/edit-post-form'

export const dynamic = 'force-dynamic'

export default async function ArticleEditPage({
	params,
}: {
	params: { slug: string }
}) {
	headers()
	const { ability } = await getServerAuthSession()
	const post = await getPost(params.slug)

	if (!post || !ability.can('create', 'Content')) {
		notFound()
	}

	return <EditPostForm key={post.fields.slug} post={post} />
}
