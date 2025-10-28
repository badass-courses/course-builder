'use client'

import React, { useState } from 'react'
import { Check, Copy } from 'lucide-react'

import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

export function CopyButton({
	text,
	className,
}: {
	text: string
	className?: string
}) {
	const [copied, setCopied] = useState(false)

	return (
		<Button
			variant="outline"
			size="icon"
			className={cn(
				'absolute bottom-1 right-1 rounded opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100',
				className,
			)}
			aria-label="Copy to clipboard"
			onClick={() => {
				navigator.clipboard.writeText(text)
				setCopied(true)
				setTimeout(() => setCopied(false), 1200)
			}}
		>
			{copied ? <Check size={16} /> : <Copy size={16} />}
		</Button>
	)
}
