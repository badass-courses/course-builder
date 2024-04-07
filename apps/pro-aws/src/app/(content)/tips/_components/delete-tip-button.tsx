'use client'

import { revalidatePath } from 'next/cache'
import { useRouter } from 'next/navigation'
import { deleteTip } from '@/lib/tips-query'

import { Button } from '@coursebuilder/ui'

export function DeleteTipButton({ id }: { id: string }) {
	const router = useRouter()
	return (
		<Button
			size="sm"
			onClick={async () => {
				if (confirm('Are you sure you want to delete this tip?')) {
					await deleteTip(id)
					router.push('/tips')
					revalidatePath('/tips')
				}
			}}
		>
			Delete
		</Button>
	)
}
