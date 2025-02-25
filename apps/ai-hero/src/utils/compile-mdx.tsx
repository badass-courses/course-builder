import { Code } from '@/components/codehike/code'
import Scrollycoding from '@/components/codehike/scrollycoding'
import { recmaCodeHike, remarkCodeHike } from 'codehike/mdx'
import { compileMDX as _compileMDX } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'

import { remarkMermaid } from '@coursebuilder/mdx-mermaid'
import { Mermaid } from '@coursebuilder/mdx-mermaid/client'

export async function compileMDX(source: string) {
	return await _compileMDX({
		source: source,
		components: {
			// @ts-expect-error
			Code,
			Scrollycoding,
			Mermaid,
		},
		options: {
			mdxOptions: {
				remarkPlugins: [
					remarkMermaid,
					remarkGfm,
					[remarkCodeHike, { components: { code: 'Code' } }],
				],
				recmaPlugins: [[recmaCodeHike, { components: { code: 'Code' } }]],
			},
		},
	})
}
