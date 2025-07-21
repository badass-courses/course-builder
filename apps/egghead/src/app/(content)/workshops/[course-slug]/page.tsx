import * as React from 'react'
import { notFound } from 'next/navigation'
import { Layout } from '@/components/app/layout'
import { getPost } from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'

export const dynamic = 'force-dynamic'

export default async function CoursePage(props: {
	params: Promise<{ 'course-slug': string }>
}) {
	const params = await props.params
	const courseSlug = params['course-slug']
	const { ability } = await getServerAuthSession()

	// For now, we'll try to get the course as a post
	// This will be replaced with proper course queries later
	const course = await getPost(courseSlug)

	if (!course || !ability.can('create', 'Content')) {
		notFound()
	}

	// Filter for course-type posts
	if (course.fields?.postType !== 'course') {
		notFound()
	}

	return (
		<Layout>
			<div className="container mx-auto py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold">{course.fields?.title}</h1>
					<p className="text-muted-foreground mt-2">
						{course.fields?.description}
					</p>
				</div>

				<div className="py-16 text-center">
					<h2 className="mb-4 text-xl font-semibold">Course Overview</h2>
					<p className="text-muted-foreground">
						Course overview and lesson management interface will be implemented
						here.
					</p>
				</div>
			</div>
		</Layout>
	)
}
