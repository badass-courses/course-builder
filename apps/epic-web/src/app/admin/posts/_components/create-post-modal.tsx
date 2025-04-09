'use client'

import { CreatePostModal } from '@/app/(content)/posts/_components/create-post-modal'

export default function CreatePostModalClient() {
	return (
		<CreatePostModal
			availableResourceTypes={['article']}
			defaultResourceType="article"
			topLevelResourceTypes={['post']}
		/>
	)
}
