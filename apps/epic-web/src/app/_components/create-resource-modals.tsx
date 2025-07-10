'use client'

import { useRouter } from 'next/navigation'
import { getResourcePath } from '@/utils/resource-paths'

import type { ContentResource } from '@coursebuilder/core/schemas'

import { CreatePostModal } from '../admin/posts/_components/create-post-modal'

/**
 * Client component wrapper for creating tips and articles with proper redirect handling.
 * Ensures resources are created before redirecting to their edit pages.
 */
export function CreateResourceModals() {
	const router = useRouter()

	/**
	 * Handles resource creation and navigation with proper timing
	 * to ensure the resource exists before redirecting
	 */
	const handleResourceCreated = async (resource: ContentResource) => {
		// Get the correct edit path based on resource type
		const resourceType =
			resource.type === 'post' && resource.fields?.postType
				? resource.fields.postType
				: resource.type

		const editPath = getResourcePath(
			resourceType,
			resource.fields?.slug || resource.id,
			'edit',
		)

		// Small delay to ensure resource is fully created and available
		await new Promise((resolve) => setTimeout(resolve, 100))

		// Navigate to the edit page
		router.push(editPath)
	}

	return (
		<>
			<CreatePostModal
				triggerLabel="New Tip"
				title="New Tip"
				availableResourceTypes={['tip']}
				defaultResourceType="tip"
				topLevelResourceTypes={['post']}
				onResourceCreated={handleResourceCreated}
			/>
			<CreatePostModal
				triggerLabel="New Article"
				title="New Article"
				availableResourceTypes={['article']}
				defaultResourceType="article"
				topLevelResourceTypes={['post']}
				onResourceCreated={handleResourceCreated}
			/>
		</>
	)
}
