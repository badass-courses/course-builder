import * as React from 'react'
import Link from 'next/link'
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
		<div className="bg-background/80 backdrop-blur-xs fixed inset-0 flex h-full w-full flex-col items-center justify-center gap-5">
			<Spinner className="h-8 w-8" />
			{title}
		</div>
	)
}

export const dynamic = 'force-dynamic'

function EditPostClient({
	post,
	videoResourceLoader,
	videoResourceId,
	tagLoader,
	instructorLoader,
	isAdmin,
	courseSlug,
}: {
	post: any
	videoResourceLoader: any
	videoResourceId: string | null | undefined
	tagLoader: any
	instructorLoader: any
	isAdmin: boolean
	courseSlug: string
}) {
	const handleResourceEdit = ({ item }: { itemId: string; item: any }) => {
		// Navigate to edit the lesson within the course context
		const lessonSlug = item.fields?.slug
		if (lessonSlug) {
			window.location.href = `/posts/${courseSlug}/edit?resource=${lessonSlug}`
		}
	}

	return (
		<EditPostForm
			post={post}
			videoResourceLoader={videoResourceLoader}
			videoResourceId={videoResourceId}
			tagLoader={tagLoader}
			instructorLoader={instructorLoader}
			isAdmin={isAdmin}
			onResourceEdit={handleResourceEdit}
		/>
	)
}

export default async function PostPage(props: {
	params: Promise<{ slug: string }>
	searchParams: Promise<{ resource?: string }>
}) {
	const params = await props.params
	const searchParams = await props.searchParams
	const { ability } = await getServerAuthSession()
	const isAdmin = ability.can('manage', 'all')

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

	return (
		<Layout>
			{/* Show course context breadcrumb when editing a lesson within a course */}
			{courseContext && (
				<div className="bg-background sticky top-0 z-10 border-b">
					<div className="container mx-auto px-4">
						<div className="flex items-center gap-2 py-3 text-sm">
							<Link
								href={`/posts/${courseContext.fields?.slug}/edit`}
								className="text-muted-foreground hover:text-foreground hover:underline"
							>
								{courseContext.fields?.title}
							</Link>
							<span className="text-muted-foreground">/</span>
							<span className="font-medium">{postToEdit.fields?.title}</span>
						</div>
					</div>
				</div>
			)}

			<React.Suspense
				fallback={<EditPostSkeleton title={postToEdit?.fields?.title || ''} />}
			>
				<EditPostClient
					post={postToEdit}
					videoResourceLoader={videoResourceLoader}
					videoResourceId={videoResource?.id}
					tagLoader={tagLoader}
					instructorLoader={instructorLoader}
					isAdmin={isAdmin}
					courseSlug={params.slug}
				/>
			</React.Suspense>
		</Layout>
	)
}
