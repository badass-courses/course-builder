'use client'

import { useRouter } from 'next/navigation'
import { getResourcePath } from '@/utils/resource-paths'

import type { ContentResource } from '@coursebuilder/core/schemas'

import { CreatePostModal } from '../posts/_components/create-post-modal'

/**
 * Client component wrapper for creating tips and articles with proper redirect handling.
 * Navigates to the edit page after resource creation completes.
 */
export function CreateResourceModals({ isAdmin }: { isAdmin?: boolean }) {
	const router = useRouter()

	/**
	 * Handles resource creation and navigation.
	 * Since createPost is synchronous and the resource exists in the database
	 * when it returns, we can navigate immediately without any delay.
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

		// Navigate to the edit page immediately
		router.push(editPath)
	}

	return (
		<>
			<CreatePostModal
				contributorSelectable={isAdmin}
				triggerLabel="New Tip"
				title="New Tip"
				availableResourceTypes={['tip']}
				defaultResourceType="tip"
				topLevelResourceTypes={['post']}
				onResourceCreated={handleResourceCreated}
			/>
			<CreatePostModal
				contributorSelectable={isAdmin}
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
