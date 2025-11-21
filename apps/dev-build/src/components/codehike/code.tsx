import React from 'react'
import { highlight, Pre, RawCode } from 'codehike/code'

import { cn } from '@coursebuilder/ui/utils/cn'

import { CopyButton } from './copy-button'
import { callout, diff, focus, fold, link, mark } from './handlers'

export async function Code({ codeblock }: { codeblock: RawCode }) {
	const highlighted = await highlight(codeblock, 'github-from-css')
	const isTerminalCode = highlighted.lang === 'shellscript'
	return (
		<div data-pre="" className="group relative w-full">
			{isTerminalCode && (
				<div
					aria-hidden="true"
					className="bg-muted mt-8 flex w-full min-w-0 items-center gap-1 rounded-t-[0.5rem] p-3"
				>
					{new Array(3).fill({}).map((_, index) => (
						<div
							key={index}
							className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-700"
						/>
					))}
				</div>
			)}
			<CopyButton text={highlighted.code} />
			<Pre
				code={highlighted}
				className={cn('bg-card! text-xs! sm:text-sm!', {
					'mt-0! rounded-t-none! rounded-b': isTerminalCode,
				})}
				style={{
					...highlighted.style,
					padding: '1rem',
					borderRadius: '0.5rem',
				}}
				handlers={[callout, fold, mark, diff, focus, link]}
			/>
		</div>
	)
}
