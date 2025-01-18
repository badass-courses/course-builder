'use client'

import React, { useState } from 'react'
import { Check, Copy } from 'lucide-react'

import { Button } from '@coursebuilder/ui'

export function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false)

	return (
		<Button
			variant="outline"
			size="icon"
			className="absolute bottom-1 right-1 rounded opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100"
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
