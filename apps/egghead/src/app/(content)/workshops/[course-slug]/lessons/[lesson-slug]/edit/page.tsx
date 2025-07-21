import * as React from 'react'
import { notFound, redirect } from 'next/navigation'
import Spinner from '@/components/spinner'
import { courseBuilderAdapter } from '@/db'
import { getPost } from '@/lib/posts-query'
import { getAllEggheadTagsCached, getTags } from '@/lib/tags-query'
import { getCachedEggheadInstructors } from '@/lib/users'
import { getServerAuthSession } from '@/server/auth'
import { subject } from '@casl/ability'

import { EditPostForm } from '../../../../posts/_components/edit-post-form'

function EditLessonSkeleton({ title = '' }: { title: string }) {
	return (
		<div className="bg-background/80 backdrop-blur-xs fixed inset-0 flex h-full w-full flex-col items-center justify-center gap-5">
			<Spinner className="h-8 w-8" />
			{title}
		</div>
	)
}

export const dynamic = 'force-dynamic'

export default async function EditLessonPage(props: {
	params: Promise<{ 'course-slug': string; 'lesson-slug': string }>
}) {
	const params = await props.params
	const courseSlug = params['course-slug']
	const lessonSlug = params['lesson-slug']
	const { ability } = await getServerAuthSession()

	// Get both course and lesson
	const [course, lesson] = await Promise.all([
		getPost(courseSlug),
		getPost(lessonSlug),
	])
	const isAdmin = ability.can('manage', 'all')

	// Validate course exists and is a course type
	if (!course || course.fields?.postType !== 'course') {
		notFound()
	}

	// Validate lesson exists and user has permissions
	if (!lesson || !ability.can('create', 'Content')) {
		notFound()
	}

	if (ability.cannot('manage', subject('Content', lesson))) {
		redirect(`/${lesson?.fields?.slug}`)
	}

	const videoResource =
		lesson.resources
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
		<React.Suspense
			fallback={<EditLessonSkeleton title={lesson?.fields?.title || ''} />}
		>
			<EditPostForm
				key={lesson.id}
				post={lesson}
				videoResourceLoader={videoResourceLoader}
				videoResourceId={videoResource?.id}
				tagLoader={tagLoader}
				instructorLoader={instructorLoader}
				isAdmin={isAdmin}
			/>
		</React.Suspense>
	)
}
