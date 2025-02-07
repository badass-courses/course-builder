/**
 * Have you ever found yourself doing something that repulses you to the very
 * core of your being? Something so gross that you’re worried if other people
 * knew about it they’d never look at you the same way again?
 *
 * Yeah, this file is one of those things.
 */

import { basename, dirname, resolve } from 'node:path'
import { createElement } from 'react'
import type { CollectionEntry } from 'astro:content'
import type { Plugin } from 'esbuild'
import { bundleMDX } from 'mdx-bundler'
import { getMDXComponent } from 'mdx-bundler/client'
import { renderToString } from 'react-dom/server'

const loadAstroAsJsx = {
	name: 'loadAstroAsJsx',
	setup(build: any) {
		build.onLoad({ filter: /(\.astro|\.tsx)$/ }, async (args: any) => {
			let contents

			switch (basename(args.path)) {
				case 'aside.astro':
					contents = `export default function Aside({ children }) { return <aside>{children}</aside>; }`
					break

				case 'codepen.astro':
					contents =
						'export default function CodePen({ slug, title }) { return <p>CodePen: <a href={`https://codepen.io/jlengstorf/pen/${slug}`}>{title}</a></p>; }'
					break

				case 'figure.astro':
					contents =
						'export default function Figure({ children }) { return <figure>{children}</figure>; }'
					break

				case 'youtube.astro':
					contents =
						'export default function YouTube({ children, id }) { return <p><a href={`https://youtu.be/${id}`}>Watch on YouTube</a></p>; }'
					break

				case 'opt-in-form.astro':
					contents = `export default function OptInForm() { return <p><a href="https://lwj.dev/newsletter">Subscribe to my newsletter for more like this!</a></p>; }`
					break

				default:
					contents = `export default function Unknown() { return <></> }`
			}

			return {
				contents,
				loader: 'jsx',
			}
		})
	},
}

export async function getHtmlFromContentCollectionEntry(
	post: CollectionEntry<'blog'>,
) {
	const result = await bundleMDX({
		source: post.body,
		esbuildOptions(options) {
			return {
				...options,
				plugins: [loadAstroAsJsx, ...(options.plugins as Plugin[])],
			}
		},
		cwd: resolve('./src/content/blog', dirname(post.id)),
	})

	const Component = await getMDXComponent(result.code)

	return renderToString(createElement(Component))
}
