import * as React from 'react'
import { notFound, redirect } from 'next/navigation'
import { Layout } from '@/components/app/layout'
import { courseBuilderAdapter } from '@/db'
import { getPost, getPostTags } from '@/lib/posts-query'
import { getAllEggheadTagsCached, getTags } from '@/lib/tags-query'
import { getServerAuthSession } from '@/server/auth'
import { subject } from '@casl/ability'

import { EditPostForm } from '../../_components/edit-post-form'

function EditPostSkeleton() {
	return (
		<div className="animate-pulse space-y-6 p-6">
			<div className="h-8 w-3/4 rounded bg-gray-200" />
			<div className="space-y-4">
				<div className="h-40 rounded bg-gray-200" />
				<div className="h-12 w-1/2 rounded bg-gray-200" />
			</div>
			<div className="space-y-2">
				<div className="h-4 w-1/4 rounded bg-gray-200" />
				<div className="h-10 rounded bg-gray-200" />
			</div>
			<div className="flex gap-2">
				<div className="h-10 w-24 rounded bg-gray-200" />
				<div className="h-10 w-24 rounded bg-gray-200" />
			</div>
		</div>
	)
}

export const dynamic = 'force-dynamic'

export default async function PostPage(props: {
	params: Promise<{ slug: string }>
}) {
	const params = await props.params
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

	console.log({ videoResourceLoader, tagLoader, post })

	return (
		<Layout>
			<React.Suspense fallback={<EditPostSkeleton />}>
				<EditPostForm
					key={post.id}
					post={post}
					videoResourceLoader={videoResourceLoader}
					videoResourceId={videoResource?.id}
					tagLoader={tagLoader}
				/>
			</React.Suspense>
		</Layout>
	)
}
