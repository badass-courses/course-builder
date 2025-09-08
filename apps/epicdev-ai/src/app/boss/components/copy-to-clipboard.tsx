'use client'

import { useState } from 'react'

import { Button } from '@coursebuilder/ui'

export default function CopyToClipboard({ content }: { content: string }) {
	const [copied, setCopied] = useState(false)
	const copyToClipboard = () => {
		navigator.clipboard.writeText(content as unknown as string)

		setCopied(true)
		setTimeout(() => setCopied(false), 1200)
	}

	return (
		<Button
			variant="outline"
			onClick={copyToClipboard}
			className="absolute right-4 top-4"
		>
			{copied ? 'Copied' : 'Copy'}
		</Button>
	)
}
