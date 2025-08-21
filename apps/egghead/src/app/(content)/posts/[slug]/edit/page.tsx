import * as React from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Layout } from '@/components/app/layout'
import Spinner from '@/components/spinner'
import { courseBuilderAdapter } from '@/db'
import { getLatestLessonsForUser, getPost } from '@/lib/posts-query'
import { getAllEggheadTagsCached, getTags } from '@/lib/tags-query'
import { getCachedEggheadInstructors } from '@/lib/users'
import { getServerAuthSession } from '@/server/auth'
import { subject } from '@casl/ability'

import { EditPostClient } from '../../_components/edit-post-client'

function EditPostSkeleton({ title = '' }: { title: string }) {
	return (
		<div className="bg-background/80 backdrop-blur-xs fixed inset-0 flex h-full w-full flex-col items-center justify-center gap-5">
			<Spinner className="h-8 w-8" />
			{title}
		</div>
	)
}

export const dynamic = 'force-dynamic'

export default async function PostPage(props: {
	params: Promise<{ slug: string }>
	searchParams: Promise<{ resource?: string }>
}) {
	const params = await props.params
	const searchParams = await props.searchParams
	const { ability, session } = await getServerAuthSession()
	const isAdmin = ability.can('manage', 'all')
	const userId = session?.user?.id

	// Get the main post (could be course or regular post)
	const mainPost = await getPost(params.slug)

	if (!mainPost || !ability.can('create', 'Content')) {
		notFound()
	}

	// Check if this is a course
	const isCourse = mainPost.fields?.postType === 'course'
	const resourceSlug = searchParams.resource

	// Determine which post we're actually editing
	let postToEdit = mainPost
	let courseContext = null

	if (isCourse && resourceSlug) {
		// We're editing a lesson within a course context
		const lessonPost = await getPost(resourceSlug)
		if (!lessonPost) {
			notFound()
		}
		postToEdit = lessonPost
		courseContext = mainPost
	}

	if (ability.cannot('manage', subject('Content', postToEdit))) {
		redirect(`/${postToEdit?.fields?.slug}`)
	}

	const videoResource =
		postToEdit.resources
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

	// Get existing resource IDs to exclude from latest lessons
	const existingResourceIds =
		postToEdit.resources?.map((item) => item.resource?.id).filter(Boolean) ?? []

	// Load latest lessons for user (only if user is logged in)
	const latestLessonsLoader = userId
		? getLatestLessonsForUser(userId, 10, existingResourceIds)
		: Promise.resolve([])

	return (
		<Layout>
			<React.Suspense
				fallback={<EditPostSkeleton title={postToEdit?.fields?.title || ''} />}
			>
				<EditPostClient
					post={postToEdit}
					videoResourceLoader={videoResourceLoader}
					videoResourceId={videoResource?.id}
					tagLoader={tagLoader}
					instructorLoader={instructorLoader}
					latestLessonsLoader={latestLessonsLoader}
					isAdmin={isAdmin}
					courseSlug={params.slug}
					courseContext={courseContext}
				/>
			</React.Suspense>
		</Layout>
	)
}
