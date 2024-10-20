'use client'

import { useRouter } from 'next/navigation'
import { deletePost } from '@/lib/posts-server-functions'

import { Button } from '@coursebuilder/ui'

export function DeletePostButton({ id }: { id: string }) {
	const router = useRouter()
	return (
		<Button
			size="sm"
			onClick={async () => {
				if (confirm('Are you sure you want to delete this post?')) {
					await deletePost(id)
					router.refresh()
				}
			}}
		>
			Delete
		</Button>
	)
}
