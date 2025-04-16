'use client'

import { CreatePostModal } from './create-post-modal'

export default function CreatePostModalClient() {
	return (
		<CreatePostModal
			availableResourceTypes={['article']}
			defaultResourceType="article"
			topLevelResourceTypes={['post']}
		/>
	)
}
