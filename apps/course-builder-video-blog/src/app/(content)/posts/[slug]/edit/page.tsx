import * as React from 'react'
import { notFound } from 'next/navigation'
import { Layout } from '@/components/app/layout'
import { courseBuilderAdapter } from '@/db'
import { getPost } from '@/lib/posts-server-functions'
import { getServerAuthSession } from '@/server/auth'

import { EditPostForm } from '../../_components/edit-post-form'

export const dynamic = 'force-dynamic'

export default async function PostPage({
	params,
}: {
	params: { slug: string }
}) {
	const { ability } = await getServerAuthSession()
	const post = await getPost(params.slug)

	if (!post || !ability.can('create', 'Content')) {
		notFound()
	}

	const resource = post.resources?.[0]?.resource.id

	const videoResourceLoader = courseBuilderAdapter.getVideoResource(resource)

	return (
		<Layout>
			<EditPostForm
				key={post.id}
				post={post}
				videoResourceLoader={videoResourceLoader}
			/>
		</Layout>
	)
}
