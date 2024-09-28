import * as React from 'react'
import { notFound, redirect } from 'next/navigation'
import { Layout } from '@/components/app/layout'
import { courseBuilderAdapter } from '@/db'
import { getPost } from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'
import { subject } from '@casl/ability'

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

	if (ability.cannot('manage', subject('Content', post))) {
		redirect(`/${post?.fields?.slug}`)
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
