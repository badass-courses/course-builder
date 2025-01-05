// https://github.com/code-hike/examples/blob/next-mdx-remote/with-next-mdx-remote-rsc/app/scrollycoding/page.tsx
import { tokenTransitions } from '@/components/codehike/code'
import { cn } from '@/utils/cn'
import { Block, CodeBlock, parseRoot } from 'codehike/blocks'
import { highlight, Pre, RawCode } from 'codehike/code'
import {
	Selectable,
	Selection,
	SelectionProvider,
} from 'codehike/utils/selection'
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

	return (
		<SelectionProvider className="relative flex-col gap-4 xl:flex xl:flex-row">
			<div className="xl:mb-[90vh] xl:flex-1">
				{steps.map((step: any, i: number) => (
					<Selectable
						key={i}
						index={i}
						selectOn={['click', 'scroll']}
						// className="data-[selected=true]:border-primary mb-24 rounded border-l-4 px-5 py-2"
						className="data-[selected=true]:border-primary -mx-5 mb-10 border-l-4 px-5"
					>
						<h2 className="mt-4 text-xl">{step.title}</h2>
						<div>{step.children}</div>
					</Selectable>
				))}
			</div>

			<div
				className={cn(
					'sticky bottom-0 -mx-5  lg:mx-auto lg:w-[40vw] lg:max-w-xl',
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
			className="bg-background max-h-[200px] text-xs sm:max-h-full sm:text-sm"
		/>
	)
}
