import * as React from 'react'
import { notFound } from 'next/navigation'
import { getPost } from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'

export default async function EditPostLayout({
	children,
	params,
}: {
	children: React.ReactNode
	params: Promise<{ slug: string }>
}) {
	const resolvedParams = await params
	const { ability } = await getServerAuthSession()

	if (!ability.can('create', 'Content')) {
		notFound()
	}

	const post = await getPost(resolvedParams.slug)

	if (!post) {
		notFound()
	}

	// Only apply split-view layout for course posts
	const isCourse = post.fields?.postType === 'course'

	if (!isCourse) {
		// For non-course posts, just render children normally
		return children
	}

	// For courses, we'll wrap with a provider that maintains course context
	// The actual split-view implementation will be in the page component
	return (
		<div data-course-id={post.id} data-course-slug={post.fields?.slug}>
			{children}
		</div>
	)
}
