import rss from '@astrojs/rss'
import type { AstroConfig } from 'astro'
import { getCollection } from 'astro:content'
import sanitizeHtml from 'sanitize-html'

import { getHtmlFromContentCollectionEntry } from '../../util/mdx'

export async function GET(context: AstroConfig) {
	const blog = await getCollection('blog')

	const mdxPosts = await Promise.all(
		blog.map(async (post) => {
			const html = await getHtmlFromContentCollectionEntry(post)

			return {
				...post,
				html,
			}
		}),
	)

	if (!context.site) {
		throw new Error('Setting a `site` in astro.config.mjs is required for RSS')
	}

	return rss({
		title: 'CodeTV Blog RSS Feed',
		description:
			'Articles and tutorials about web dev, career growth, and more.',
		site: context.site,
		// TODO figure out if you can style the content of an RSS feed
		// stylesheet: '/rss-styles.xsl',
		items: mdxPosts
			.sort(
				(a, b) =>
					new Date(b.data.pubDate).valueOf() -
					new Date(a.data.pubDate).valueOf(),
			)
			.map((post) => {
				const img = post.data.share?.image ?? false

				let html = ''

				// if a sharing image was set, put it at the top of the post
				if (img) {
					html += `<p><img src="${img}" alt="${post.data.title}" /></p>`
				}

				html += post.html

				return {
					title: post.data.title,
					pubDate: post.data.pubDate,
					description: post.data.description,
					link: `/blog/${post.slug}`,
					content: sanitizeHtml(html, {
						// images are stripped by default
						allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
					}),
				}
			}),
	})
}
