'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { getResourcePath } from '@/utils/resource-paths'

import type { ContentResource } from '@coursebuilder/core/schemas'

import { CreatePostModal } from '../admin/posts/_components/create-post-modal'

/**
 * Component that renders resource creation modals for tips and articles.
 * Handles resource creation and navigation to their edit pages.
 */
export function CreateResourceModals() {
	const router = useRouter()

	/**
	 * Handles resource creation and navigation.
	 * Since createPost is synchronous and the resource exists in the database
	 * when creation completes, we can navigate immediately.
	 */
	const handleResourceCreated = async (resource: ContentResource) => {
		const editUrl = getResourcePath(
			resource.type,
			resource.fields?.slug || resource.id,
			'edit',
		)

		// Navigate to the edit page immediately after resource creation
		router.push(editUrl)
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
