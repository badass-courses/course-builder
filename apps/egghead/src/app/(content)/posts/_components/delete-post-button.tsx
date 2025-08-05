'use client'

import { useRouter } from 'next/navigation'
import { deletePost } from '@/lib/posts-query'
import { Trash } from 'lucide-react'

import { Button } from '@coursebuilder/ui'

export function DeletePostButton({ id }: { id: string }) {
	const router = useRouter()
	return (
		<Button
			variant="ghost"
			size="icon"
			className="h-7 w-7 border border-gray-200 bg-white/90 text-gray-900 hover:bg-white dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-100 dark:hover:bg-gray-900"
			title="Delete post"
			onClick={async () => {
				if (confirm('Are you sure you want to delete this post?')) {
					await deletePost(id)
					router.refresh()
				}
			}}
		>
			<Trash className="h-3.5 w-3.5" />
		</Button>
	)
}
