'use client'

import { useRouter } from 'next/navigation'
import { deletePost } from '@/lib/posts-query'
import { Trash } from 'lucide-react'

import { Button } from '@coursebuilder/ui'

export function DeletePostButton({ id }: { id: string }) {
	const router = useRouter()
	return (
		<Button
			variant="destructive"
			size="icon"
			className="h-6 w-6"
			onClick={async () => {
				if (confirm('Are you sure you want to delete this post?')) {
					await deletePost(id)
					router.refresh()
				}
			}}
		>
			<Trash className="h-3 w-3" />
		</Button>
	)
}
