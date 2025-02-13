import * as React from 'react'
import { notFound, redirect } from 'next/navigation'
import { Layout } from '@/components/app/layout'
import Spinner from '@/components/spinner'
import { courseBuilderAdapter } from '@/db'
import { getPost } from '@/lib/posts-query'
import { getAllEggheadTagsCached, getTags } from '@/lib/tags-query'
import { getCachedEggheadInstructors } from '@/lib/users'
import { getServerAuthSession } from '@/server/auth'
import { subject } from '@casl/ability'

import { EditPostForm } from '../../_components/edit-post-form'

function EditPostSkeleton({ title = '' }: { title: string }) {
	return (
		<div className="bg-background/80 fixed inset-0 flex h-full w-full flex-col items-center justify-center gap-5 backdrop-blur-sm">
			<Spinner className="h-8 w-8" />
			{title}
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
	const isAdmin = ability.can('manage', 'all')

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
	const instructorLoader = getCachedEggheadInstructors()

	return (
		<Layout>
			<React.Suspense
			// fallback={<EditPostSkeleton title={post?.fields?.title} />}
			>
				<EditPostForm
					key={post.id}
					post={post}
					videoResourceLoader={videoResourceLoader}
					videoResourceId={videoResource?.id}
					tagLoader={tagLoader}
					instructorLoader={instructorLoader}
					isAdmin={isAdmin}
				/>
			</React.Suspense>
		</Layout>
	)
}
