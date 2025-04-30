'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { PageBlocks } from '@/app/admin/pages/_components/page-builder-mdx-components'
import { ImageResourceUploader } from '@/components/image-uploader/image-resource-uploader'
import { withResourceForm } from '@/components/resource-form/with-resource-form'
import type { List } from '@/lib/lists'
import { Post } from '@/lib/posts'
import { ImagePlusIcon, LayoutTemplate, VideoIcon } from 'lucide-react'

import { VideoResource } from '@coursebuilder/core/schemas/video-resource'

import { postFormConfig } from './post-form-config'
import { PostFormFields } from './post-form-fields'
import StandaloneVideoResourceUploaderAndViewer from './standalone-video-resource-uploader-and-viewer'

export type EditPostFormProps = {
	post: Post
	videoResourceLoader?: Promise<VideoResource | null>
	videoResource?: VideoResource | null
	listsLoader: Promise<List[]>
}

/**
 * Enhanced post form with common resource form functionality and video handling
 */
export function EditPostForm({
	post,
	videoResourceLoader,
	videoResource,
	listsLoader,
}: EditPostFormProps) {
	const router = useRouter()

	// Handle either direct videoResource or resolve from loader
	const resolvedVideoResource =
		videoResource ||
		(videoResourceLoader ? React.use(videoResourceLoader) : null)

	const PostForm = withResourceForm(
		(props) => (
			<PostFormFields
				{...props}
				videoResource={resolvedVideoResource}
				listsLoader={listsLoader}
			/>
		),
		{
			...postFormConfig,
			onSave: async (resource, hasNewSlug) => {
				if (hasNewSlug) {
					router.push(`/posts/${resource.fields?.slug}/edit`)
				}
			},
			customTools: [
				{
					id: 'images',
					icon: () => (
						<ImagePlusIcon strokeWidth={1.5} size={24} width={18} height={18} />
					),
					toolComponent: (
						<ImageResourceUploader
							key={'image-uploader'}
							belongsToResourceId={post.id}
							uploadDirectory={`posts`}
						/>
					),
				},
				{
					id: 'MDX Components',
					label: 'MDX Components',
					icon: () => (
						<LayoutTemplate
							strokeWidth={1.5}
							size={24}
							width={18}
							height={18}
						/>
					),
					toolComponent: (
						<div className="mt-3 px-5">
							<h3 className="mb-3 inline-flex text-xl font-bold">
								MDX Components
							</h3>
							<PageBlocks />
						</div>
					),
				},
				{
					id: 'videos',
					icon: () => (
						<VideoIcon strokeWidth={1.5} size={24} width={18} height={18} />
					),
					toolComponent: <StandaloneVideoResourceUploaderAndViewer />,
				},
			],
		},
	)

	return <PostForm resource={post} />
}
