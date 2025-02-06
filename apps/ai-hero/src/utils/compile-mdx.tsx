import { Code } from '@/components/codehike/code'
import Scrollycoding from '@/components/codehike/scrollycoding'
import { recmaCodeHike, remarkCodeHike } from 'codehike/mdx'
import { compileMDX as _compileMDX } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'

export async function compileMDX(source: string) {
	return await _compileMDX({
		source: source,
		// @ts-expect-error
		components: { Code, Scrollycoding },
		options: {
			mdxOptions: {
				remarkPlugins: [
					remarkGfm,
					[
						remarkCodeHike,
						{
							components: { code: 'Code' },
						},
					],
				],
				recmaPlugins: [
					[
						recmaCodeHike,
						{
							components: { code: 'Code' },
						},
					],
				],
			},
		},
	})
}
