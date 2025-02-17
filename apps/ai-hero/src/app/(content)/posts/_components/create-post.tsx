'use client'

import { useRouter } from 'next/navigation'
import { PostUploader } from '@/app/(content)/posts/_components/post-uploader'
import { NewResourceWithVideoForm } from '@/components/resources-crud/new-resource-with-video-form'
import { createPost } from '@/lib/posts-query'
import { getVideoResource } from '@/lib/video-resource-query'
import { FilePlus2 } from 'lucide-react'
import pluralize from 'pluralize'

import type { ContentResource } from '@coursebuilder/core/schemas'

/**
 * Props for the CreatePost component, allowing a custom onResourceCreated callback
 * that can bypass default navigation behavior.
 */
export interface CreatePostProps {
	/**
	 * If provided, called instead of the default router.push to the resource’s edit page.
	 */
	onResourceCreated?: (resource: ContentResource) => void
}

/**
 * Creates a new post resource. If a custom `onResourceCreated` is provided,
 * that callback is used instead of the default router navigation.
 */
export function CreatePost({
	onResourceCreated,
}: CreatePostProps = {}): JSX.Element {
	const router = useRouter()

	return (
		<NewResourceWithVideoForm
			className="[&_label]:fluid-lg [&_label]:font-heading [&_[data-sr-button]]:h-10 [&_label]:font-semibold"
			onResourceCreated={async (resource: ContentResource) => {
				if (onResourceCreated) {
					onResourceCreated(resource)
				} else {
					router.push(
						`/${pluralize(resource.type)}/${resource.fields?.slug || resource.id}/edit`,
					)
				}
			}}
			createResource={createPost}
			getVideoResource={getVideoResource}
			availableResourceTypes={['article', 'lesson']}
			uploadEnabled={false}
		>
			{(handleSetVideoResourceId: (id: string) => void) => (
				<PostUploader setVideoResourceId={handleSetVideoResourceId} />
			)}
		</NewResourceWithVideoForm>
	)
}
