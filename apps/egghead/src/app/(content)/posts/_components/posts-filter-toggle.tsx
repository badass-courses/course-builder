'use client'

import { useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@coursebuilder/ui'

export function PostsFilterToggle({ canManageAll }: { canManageAll: boolean }) {
	const router = useRouter()
	const searchParams = useSearchParams()
	const showingAll = searchParams.get('view') === 'all'

	if (!canManageAll) return null

	const handleToggle = () => {
		const newPath = showingAll ? '/posts' : '/posts?view=all'
		router.push(newPath)
	}

	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={handleToggle}
			className="text-muted-foreground hover:text-foreground"
		>
			{showingAll ? '👤 Show My Posts' : '👥 Show All Posts'}
		</Button>
	)
}
