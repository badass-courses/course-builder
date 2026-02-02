'use client'

import React, { useState } from 'react'
import { CheckIcon, ClipboardIcon } from 'lucide-react'

import { Button } from '@coursebuilder/ui'
import type { ButtonProps } from '@coursebuilder/ui/primitives/button'
import { cn } from '@coursebuilder/ui/utils/cn'

export const CopyAsMarkdown = (props: ButtonProps & { query: string }) => {
	const [copied, setCopied] = useState(false)

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(props.query)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch (err) {
			console.error('Failed to copy:', err)
		}
	}

	return (
		<Button
			variant="ghost"
			{...props}
			className={cn('flex items-center gap-2', props.className)}
			onClick={(e) => {
				e.preventDefault()
				handleCopy()
			}}
		>
			<span className="shrink-0">
				{copied ? (
					<CheckIcon className="size-4" />
				) : (
					<ClipboardIcon className="size-4" />
				)}
			</span>
			<span className="min-w-[15ch] flex-1 text-left">
				{copied ? 'Copied!' : 'Copy as Markdown'}
			</span>
		</Button>
	)
}
