import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { courseBuilderAdapter } from '@/db'
import { getAllLists } from '@/lib/lists-query'
import { getPost } from '@/lib/posts-query'
import { getTags } from '@/lib/tags-query'
import { getServerAuthSession } from '@/server/auth'
import { subject } from '@casl/ability'

import { EditPostForm } from '../../_components/edit-post-form'

export const dynamic = 'force-dynamic'

type Props = {
	params: Promise<{ slug: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
	props: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params
	const post = await getPost(params.slug)

	if (!post) {
		return parent as Metadata
	}

	return {
		title: `📝 ${post.fields.title}`,
	}
}

export default async function ArticleEditPage(props: {
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
		? courseBuilderAdapter.getVideoResource(videoResource.id)
		: Promise.resolve(null)
	const tagLoader = getTags()
	const listsLoader = getAllLists()

	return (
		<EditPostForm
			key={post.fields.slug}
			post={{ ...post }}
			tagLoader={tagLoader}
			videoResourceLoader={videoResourceLoader}
			listsLoader={listsLoader}
		/>
	)
}
