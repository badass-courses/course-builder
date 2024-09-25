'use client'

import toast from 'react-hot-toast'

import { Button } from '@coursebuilder/ui'

export function CopyEggheadLinkButton({ slug }: { slug: string }) {
	console.log('slug', slug)
	return (
		<Button
			size="sm"
			onClick={() => {
				toast.success('Copied to clipboard')
				return navigator.clipboard.writeText(`https://egghead.io/${slug}`)
			}}
		>
			Copy egghead URL
		</Button>
	)
}
