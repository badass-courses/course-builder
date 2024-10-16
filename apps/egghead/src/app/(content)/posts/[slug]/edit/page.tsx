import * as React from 'react'
import { notFound, redirect } from 'next/navigation'
import { Layout } from '@/components/app/layout'
import { courseBuilderAdapter } from '@/db'
import { getPost, getPostTags } from '@/lib/posts-query'
import { getAllEggheadTagsCached, getTags } from '@/lib/tags-query'
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

	const videoResource =
		post.resources
			?.map((resource) => resource.resource)
			?.find((resource) => {
				return resource.type === 'videoResource'
			}) || null

	const videoResourceLoader = videoResource
		? courseBuilderAdapter.getVideoResource(videoResource?.id)
		: Promise.resolve(null)

	await getAllEggheadTagsCached()
	const tagLoader = getTags()

	return (
		<Layout>
			<EditPostForm
				key={post.id}
				post={post}
				videoResourceLoader={videoResourceLoader}
				videoResourceId={videoResource?.id}
				tagLoader={tagLoader}
			/>
		</Layout>
	)
}
