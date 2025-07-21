import * as React from 'react'
import { notFound, redirect } from 'next/navigation'
import { Layout } from '@/components/app/layout'
import { CourseResourcesSidebar } from '@/components/course-resources-sidebar'
import Spinner from '@/components/spinner'
import {
	Sidebar,
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from '@/components/ui/sidebar'
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

	// Get course lessons if this is a course
	const courseLessons = isCourse
		? mainPost.resources
				?.map((r) => r.resource)
				?.filter((resource) => {
					const fields = resource.fields as any
					return fields?.postType === 'lesson'
				}) || []
		: []

	// For course editing with split view
	if (isCourse) {
		return (
			<Layout>
				<SidebarProvider defaultOpen={true}>
					<div className="flex min-h-screen w-full">
						<Sidebar side="right" className="w-80 border-l">
							<CourseResourcesSidebar
								course={mainPost}
								resources={courseLessons}
								currentResourceSlug={resourceSlug}
								courseSlug={params.slug}
							/>
						</Sidebar>

						<SidebarInset className="flex-1">
							<div className="flex h-full flex-col">
								{/* Header with breadcrumbs and sidebar toggle */}
								{courseContext && (
									<div className="bg-background sticky top-0 z-10 border-b">
										<div className="flex items-center justify-between gap-4 p-4">
											<div className="flex items-center gap-2 text-sm">
												<span className="text-muted-foreground">
													{courseContext.fields?.title}
												</span>
												<span className="text-muted-foreground">/</span>
												<span className="font-medium">
													{postToEdit.fields?.title}
												</span>
											</div>
											<SidebarTrigger className="md:hidden" />
										</div>
									</div>
								)}

								{/* Main content area */}
								<main className="flex-1">
									<React.Suspense
										fallback={
											<EditPostSkeleton
												title={postToEdit?.fields?.title || ''}
											/>
										}
									>
										<EditPostForm
											key={postToEdit.id}
											post={postToEdit}
											videoResourceLoader={videoResourceLoader}
											videoResourceId={videoResource?.id}
											tagLoader={tagLoader}
											instructorLoader={instructorLoader}
											isAdmin={isAdmin}
										/>
									</React.Suspense>
								</main>
							</div>
						</SidebarInset>
					</div>
				</SidebarProvider>
			</Layout>
		)
	}

	// For regular post editing (non-course)
	return (
		<Layout>
			<React.Suspense
				fallback={<EditPostSkeleton title={postToEdit?.fields?.title || ''} />}
			>
				<EditPostForm
					key={postToEdit.id}
					post={postToEdit}
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
