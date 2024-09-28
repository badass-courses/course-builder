'use client'

import toast from 'react-hot-toast'

import { Button } from '@coursebuilder/ui'

export function CopyLinkButton({ slug }: { slug: string }) {
	console.log('slug', slug)
	return (
		<Button
			size="sm"
			onClick={() => {
				toast.success('Copied to clipboard')
				return navigator.clipboard.writeText(
					`https://www.epicreact.dev/${slug}`,
				)
			}}
		>
			Copy Epic React link
		</Button>
	)
}
