// https://github.com/code-hike/examples/blob/next-mdx-remote/with-next-mdx-remote-rsc/app/scrollycoding/page.tsx
import React from 'react'
import { tokenTransitions } from '@/components/codehike/code'
import { cn } from '@/utils/cn'
import { Block, CodeBlock, parseRoot } from 'codehike/blocks'
import { highlight, Pre, RawCode } from 'codehike/code'
import {
	Selectable,
	Selection,
	SelectionProvider,
} from 'codehike/utils/selection'
import { ArrowDown, ChevronDown } from 'lucide-react'
import type { MDXContent } from 'mdx/types'
import { z } from 'zod'

const Schema = Block.extend({
	steps: z.array(Block.extend({ code: CodeBlock })),
})
export default function Scrollycoding(props: any) {
	console.log('Scrollycoding props', props)
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
		<div className="mt-8">
			<p className="not-prose flex w-full items-center justify-end gap-1 py-3 text-center font-mono text-xs font-medium uppercase tracking-wide text-gray-400">
				Scrollycoding
				<ArrowDown size={12} />
			</p>
			<SelectionProvider className="relative mb-10 flex-col gap-5 sm:mb-24 lg:flex lg:flex-row">
				<div className="mb-10 flex flex-col gap-10 lg:flex-1">
					{steps.map((step: any, i: number) => (
						<Selectable
							key={i}
							index={i}
							selectOn={['click', 'scroll']}
							className="data-[selected=true]:border-primary hover:bg-secondary first-of-type:prose-headings:mt-5 -mx-5 cursor-pointer rounded border-l-4 px-5 transition duration-100 ease-in-out data-[selected=false]:hover:border-gray-700 sm:mx-0"
						>
							{step._data?.header && renderHeading(step._data.header)}
							<div>{step.children}</div>
						</Selectable>
					))}
				</div>
				<div
					className={cn(
						'sticky bottom-0 -mx-6 lg:mx-0 lg:w-[40vw] lg:max-w-xl',
						{
							// padding top dynamic based on height of the first selectable item
						},
					)}
				>
					<div className="sticky top-10 overflow-auto lg:sticky lg:top-16">
						<Selection
							from={steps.map((step: any) => (
								<Code codeblock={step.code} />
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
	const highlighted = await highlight(codeblock, 'github-dark')
	return (
		<Pre
			code={highlighted}
			handlers={[tokenTransitions]}
			className="mb-0 mt-0 h-full max-h-[300px] rounded-none bg-[#0d1117] p-5 text-xs shadow-inner sm:max-h-full sm:rounded sm:text-sm sm:shadow-xl"
		/>
	)
}
