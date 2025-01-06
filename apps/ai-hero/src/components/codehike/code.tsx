import React from 'react'
import { highlight, Pre, RawCode } from 'codehike/code'

import { callout, diff, focus, fold, link, mark } from './handlers'

export async function Code({ codeblock }: { codeblock: RawCode }) {
	const highlighted = await highlight(codeblock, 'github-dark')
	return (
		<Pre
			code={highlighted}
			className="bg-background text-xs sm:text-sm"
			style={{ ...highlighted.style, padding: '1rem', borderRadius: '0.5rem' }}
			handlers={[callout, fold, mark, diff, focus, link]}
		/>
	)
}
