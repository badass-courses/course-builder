'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PostUploader } from '@/app/(content)/posts/_components/post-uploader'
import { useResource } from '@/components/resource-form/resource-context'
import { NewResourceWithVideoForm } from '@/components/resources-crud/new-resource-with-video-form'
import { createPost } from '@/lib/posts-query'
import { getVideoResource } from '@/lib/video-resource-query'
import { EditIcon, ExternalLink } from 'lucide-react'
import pluralize from 'pluralize'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

/**
 * Props for the CreatePost component, allowing a custom onResourceCreated callback
 * that can bypass default navigation behavior.
 */
export interface CreatePostProps {
	/**
	 * If provided, called instead of the default router.push to the resource's edit page.
	 */
	onResourceCreated?: (resource: ContentResource) => Promise<void>
	/**
	 * The default type of resource to create
	 * @default 'article'
	 */
	defaultResourceType?: string
	/**
	 * List of allowed resource types that can be created
	 * @default ['article', 'lesson']
	 */
	availableResourceTypes?: string[]
	/**
	 * List of top-level resource types (not post subtypes)
	 */
	topLevelResourceTypes?: string[]
	/**
	 * Called when navigation is about to start
	 */
	onNavigationStart?: () => void
	/**
	 * Whether to enable video upload
	 * @default true
	 */
	uploadEnabled?: boolean
	/**
	 * Called when processing is started
	 */
	setIsProcessing?: (isProcessing: boolean) => void
}

/**
 * Creates a new post resource. If a custom `onResourceCreated` is provided,
 * that callback is used instead of the default router navigation.
 */
export function CreatePost({
	onResourceCreated,
	defaultResourceType = 'article',
	availableResourceTypes = ['article'],
	topLevelResourceTypes,
	onNavigationStart,
	uploadEnabled = true,
	setIsProcessing,
}: CreatePostProps = {}): JSX.Element {
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const resource = useResource()
	const parentResource = resource?.resource
	const [resourceEditUrl, setResourceEditUrl] = useState<string | null>(null)
	const [resourceViewUrl, setResourceViewUrl] = useState<string | null>(null)

	return (
		<>
			<NewResourceWithVideoForm
				className=""
				onResourceCreated={async (
					resource: ContentResource,
					title,
					resetForm: () => void,
				) => {
					const getUrl = (type: 'edit' | 'view') =>
						getResourcePath(
							resource.type,
							resource.fields?.slug || resource.id,
							type,
							parentResource && {
								parentType: parentResource.type,
								parentSlug: parentResource.fields?.slug || parentResource.id,
							},
						)
					setResourceEditUrl(getUrl('edit'))
					setResourceViewUrl(getUrl('view'))

					// Then notify parent components
					if (onResourceCreated) {
						await onResourceCreated(resource)
					}
					if (setIsProcessing) {
						setIsProcessing(false)
					}
					resetForm()
				}}
				createResource={async (input) => {
					// All posts get created the same way now
					return createPost(input)
				}}
				getVideoResource={getVideoResource}
				availableResourceTypes={availableResourceTypes}
				defaultPostType={defaultResourceType}
				topLevelResourceTypes={topLevelResourceTypes}
				uploadEnabled={uploadEnabled}
			>
				{(handleSetVideoResourceId: (id: string) => void) => (
					<>
						<PostUploader setVideoResourceId={handleSetVideoResourceId} />
					</>
				)}
			</NewResourceWithVideoForm>
			{resourceEditUrl && (
				<div className="flex items-center justify-center gap-2 pt-2">
					Resource created.{' '}
					<Link
						href={resourceEditUrl}
						target="_blank"
						className="inline-flex items-center underline"
					>
						Edit <EditIcon className="ml-1 size-4" />
					</Link>
					{resourceViewUrl && (
						<Link
							href={resourceViewUrl}
							target="_blank"
							className="inline-flex items-center underline"
						>
							View <ExternalLink className="ml-1 size-4" />
						</Link>
					)}
				</div>
			)}
		</>
	)
}
