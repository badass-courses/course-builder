// https://github.com/code-hike/examples/blob/next-mdx-remote/with-next-mdx-remote-rsc/app/scrollycoding/page.tsx
import React from 'react'
import { tokenTransitions } from '@/components/codehike/token-transitions'
import { cn } from '@/utils/cn'
import { Block, CodeBlock, parseRoot } from 'codehike/blocks'
import { highlight, Pre, RawCode } from 'codehike/code'
import {
	Selectable,
	Selection,
	SelectionProvider,
} from 'codehike/utils/selection'
import { ArrowDown } from 'lucide-react'
import { z } from 'zod'

import { CopyButton } from './copy-button'

const Schema = Block.extend({
	steps: z.array(Block.extend({ code: CodeBlock })),
})

export default function Scrollycoding(props: any) {
	if (!props) return null

	// const { steps } = parseRoot(props, Schema)
	const { steps } = props

	const getHeadingLevel = (header: string) => {
		const match = header?.match(/^(#{1,6})\s/)
		return match ? match[1]?.length : 2 // default to h2 if no match
	}

	const renderHeading = (header: string) => {
		const level = getHeadingLevel(header)
		const H = `h${level}` as any
		// Remove both the markdown heading symbols and the !!steps prefix
		const cleanContent = header.replace(/^#{1,6}\s/, '').replace('!!steps ', '')

		if (cleanContent === '!!steps') return null
		return <H className="text-xl">{cleanContent}</H>
	}

	return (
		<div className="mt-8 w-auto">
			<p className="not-prose flex w-full items-center justify-end gap-1 py-3 text-center font-mono text-xs font-medium uppercase tracking-wide text-gray-400">
				Scrollycoding
				<ArrowDown size={12} />
			</p>
			<SelectionProvider className="relative mb-10 flex grid-cols-2 flex-col gap-5 sm:mb-24 lg:grid">
				<div className="mb-10 flex flex-1 flex-col">
					{steps.map((step: any, i: number) => (
						<Selectable
							key={i}
							index={i}
							selectOn={['click', 'scroll']}
							className="data-[selected=true]:border-primary hover:bg-secondary prose-headings:first-of-type:mt-5 group relative -mx-5 flex cursor-pointer items-start border-l-2 pl-9 pr-5 transition duration-100 ease-in-out hover:rounded data-[selected=false]:hover:border-gray-700 sm:mx-0 sm:pl-5 lg:pl-6"
						>
							<div className="bg-secondary group-data-[selected=true]:bg-primary group-data-[selected=true]:border-primary group-data-[selected=true]:text-primary-foreground absolute left-1 top-5 flex size-7 shrink-0 origin-center scale-90 items-center justify-center rounded-full border-2 text-xs font-bold shadow-xl sm:left-[-15px] sm:top-7 sm:size-7 sm:text-xs lg:scale-100">
								{i + 1}
							</div>
							{step._data?.header && renderHeading(step._data.header)}
							<div>{step.children}</div>
						</Selectable>
					))}
				</div>
				<div
					className={cn('sticky bottom-5 w-full lg:mx-0', {
						// padding top dynamic based on height of the first selectable item
					})}
				>
					<div className="sticky top-10 w-full lg:sticky lg:top-32">
						<Selection
							from={steps.map((step: any) => (
								<Code key={step.code} codeblock={step.code} />
							))}
						/>
					</div>
				</div>
			</SelectionProvider>
		</div>
	)
}

async function Code({
	codeblock,
}: {
	codeblock: {
		meta: string
		value: string
		lang: string
	}
}) {
	if (!codeblock) {
		return <div>codeblock error</div>
	}

	const highlighted = await highlight(codeblock, 'github-from-css')
	return (
		<>
			<Pre
				code={highlighted}
				handlers={[tokenTransitions]}
				className="!bg-card mb-0 mt-0 h-full max-h-[300px] rounded-none p-5 !text-sm shadow-inner sm:max-h-full sm:rounded sm:text-sm sm:shadow-xl"
				style={{
					...highlighted.style,
					padding: '1rem',
					borderRadius: '0.5rem',
				}}
			/>
			<CopyButton text={highlighted.code} />
			{/* 
			<div data-pre="" className="group relative w-auto">
				<Pre
					code={highlighted}
					className={cn('bg-card! text-xs sm:text-sm', {})}
					style={{
						...highlighted.style,
						padding: '1rem',
						borderRadius: '0.5rem',
					}}
					handlers={[tokenTransitions]}
					// handlers={[callout, fold, mark, diff, focus, link]}
				/>
			</div> */}
		</>
	)
}
