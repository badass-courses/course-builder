'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FilePlus2 } from 'lucide-react'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { Button } from '@coursebuilder/ui'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

import { CreatePostModal } from '../posts/_components/create-post-modal'
import { CreateWorkshopModal } from '../workshops/_components/create-workshop-modal'

/**
 * Client component wrapper for creating tips, articles, and tutorials with proper redirect handling.
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
			<CreatePostModal
				contributorSelectable={isAdmin}
				triggerLabel="New Tutorial"
				title="New Tutorial"
				availableResourceTypes={['tutorial']}
				defaultResourceType="tutorial"
				topLevelResourceTypes={['tutorial']}
				uploadEnabled={false}
				onResourceCreated={handleResourceCreated}
			/>
			<CreateWorkshopModal
				contributorSelectable={isAdmin}
				onResourceCreated={handleResourceCreated}
			/>
			{isAdmin && (
				<Button asChild className="gap-1">
					<Link href="/products/new">
						<FilePlus2 className="h-4 w-4" />
						New Product
					</Link>
				</Button>
			)}
		</>
	)
}
