'use client'

import * as React from 'react'
import { ChevronDown, ChevronRight, Copy } from 'lucide-react'

interface JsonViewerProps {
	data: unknown
	title?: string
}

export const JsonViewer: React.FC<JsonViewerProps> = ({
	data,
	title = 'JSON Data',
}) => {
	const [isExpanded, setIsExpanded] = React.useState(true)
	const [copySuccess, setCopySuccess] = React.useState(false)

	const handleCopy = () => {
		navigator.clipboard.writeText(JSON.stringify(data, null, 2))
		setCopySuccess(true)
		setTimeout(() => setCopySuccess(false), 2000)
	}

	return (
		<div className="rounded-lg bg-white p-6 shadow-md">
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<button
						onClick={() => setIsExpanded(!isExpanded)}
						className="rounded p-1 hover:bg-gray-100"
					>
						{isExpanded ? (
							<ChevronDown className="h-4 w-4" />
						) : (
							<ChevronRight className="h-4 w-4" />
						)}
					</button>
					<h2 className="text-lg font-semibold">{title}</h2>
				</div>
				<button
					onClick={handleCopy}
					className="flex items-center space-x-2 rounded bg-gray-100 px-3 py-1 text-sm transition-colors hover:bg-gray-200"
					title="Copy to clipboard"
				>
					<Copy className="h-4 w-4" />
					<span>{copySuccess ? 'Copied!' : 'Copy'}</span>
				</button>
			</div>
			{isExpanded && (
				<pre className="max-h-[600px] overflow-auto rounded bg-gray-50 p-4 text-sm">
					<code className="text-gray-800">{JSON.stringify(data, null, 2)}</code>
				</pre>
			)}
		</div>
	)
}
