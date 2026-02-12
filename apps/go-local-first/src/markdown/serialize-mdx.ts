import { remarkCodeHike } from '@code-hike/mdx'
import { nodeTypes } from '@mdx-js/mdx'
import { type MDXRemoteSerializeResult } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'

import {
	shikiRemotePlugin,
	ShikiRemotePluginOptions,
} from './shiki-remote-plugin'

type RemarkCodeHikePluginOptions = {
	theme?: ShikiTheme
	lineNumbers?: boolean
	showCopyButton?: boolean
	autoImport?: boolean
}

type SerializeMDXProps = {
	scope?: Record<string, unknown>
} & (
	| {
			useShikiTwoslash: true
			syntaxHighlighterOptions: ShikiRemotePluginOptions
	  }
	| {
			useShikiTwoslash?: false
			syntaxHighlighterOptions?: RemarkCodeHikePluginOptions
	  }
)

const serializeMDX = async (
	text: string,
	{ scope, syntaxHighlighterOptions, useShikiTwoslash }: SerializeMDXProps = {},
): Promise<MDXRemoteSerializeResult> => {
	if (useShikiTwoslash) {
		const timeoutInMilliseconds = 180000 // Set your desired timeout duration here
		const mdxContent = await Promise.race([
			serialize(text, {
				scope,
				blockJS: false,
				mdxOptions: {
					useDynamicImport: true,
					rehypePlugins: [[rehypeRaw, { passThrough: nodeTypes }], rehypeSlug],
					remarkPlugins: [
						[
							shikiRemotePlugin,
							syntaxHighlighterOptions satisfies ShikiRemotePluginOptions,
						],
					],
				},
			}),
			new Promise((_, reject) =>
				setTimeout(
					() => reject(new Error('😭 shiki mdx serialization timed out')),
					timeoutInMilliseconds,
				),
			),
		])
		return mdxContent as MDXRemoteSerializeResult
	} else {
		const lineNumbers =
			syntaxHighlighterOptions && 'lineNumbers' in syntaxHighlighterOptions
				? syntaxHighlighterOptions.lineNumbers
				: false

		const showCopyButton =
			syntaxHighlighterOptions && 'showCopyButton' in syntaxHighlighterOptions
				? syntaxHighlighterOptions.showCopyButton
				: false

		const theme = syntaxHighlighterOptions?.theme
		const mdxContent = await serialize(text, {
			scope,
			blockJS: false,
			mdxOptions: {
				useDynamicImport: true,
				rehypePlugins: [rehypeSlug],
				remarkPlugins: [
					[
						remarkCodeHike,
						{
							theme: theme || 'dark-plus',
							autoImport: false,
							lineNumbers,
							showCopyButton,
							// ...syntaxHighlighterOptions,
						} as RemarkCodeHikePluginOptions,
					],
				],
			},
		})
		return mdxContent
	}
}

export default serializeMDX

type ShikiTheme =
	| 'dark-plus'
	| 'dracula-soft'
	| 'dracula'
	| 'github-dark'
	| 'github-dark-dimmed'
	| 'github-light'
	| 'light-plus'
	| 'material-darker'
	| 'material-default'
	| 'material-lighter'
	| 'material-ocean'
	| 'material-palenight'
	| 'min-dark'
	| 'min-light'
	| 'monokai'
	| 'nord'
	| 'one-dark-pro'
	| 'poimandres'
	| 'slack-dark'
	| 'slack-ochin'
	| 'solarized-dark'
	| 'solarized-light'
