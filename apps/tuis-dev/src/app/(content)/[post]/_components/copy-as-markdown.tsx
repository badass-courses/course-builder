'use client'

import { useState } from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'

import { Button } from '@coursebuilder/ui'

export function CopyAsMarkdown({ text }: { text: string }) {
	const [copied, setCopied] = useState(false)

	return (
		<Button
			type="button"
			variant="outline"
			onClick={() => {
				navigator.clipboard.writeText(text)
				setCopied(true)
				setTimeout(() => setCopied(false), 2000)
			}}
		>
			<div className="border-r">
				<div className="relative mr-2 size-3">
					<CopyIcon
						className={`absolute inset-0 size-3 transition-opacity ${copied ? 'opacity-0' : 'opacity-100'}`}
					/>
					<CheckIcon
						className={`absolute inset-0 size-3 transition-opacity ${copied ? 'opacity-100' : 'opacity-0'}`}
					/>
				</div>
			</div>
			<span className="grid overflow-hidden">
				<span
					className={`col-start-1 row-start-1 transition-transform ${copied ? '-translate-y-full' : 'translate-y-0'}`}
				>
					Copy as markdown
				</span>
				<span
					className={`col-start-1 row-start-1 transition-transform ${copied ? 'translate-y-0' : 'translate-y-full'}`}
				>
					Copied!
				</span>
			</span>
		</Button>
	)
}
