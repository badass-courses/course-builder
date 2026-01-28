import type { Heading as MdastHeading, Root } from 'mdast'
import { toString } from 'mdast-util-to-string'
import { remark } from 'remark'
import remarkMdx from 'remark-mdx'
import { visit } from 'unist-util-visit'

import { slugifyHeading } from './extract-markdown-headings'

/**
 * Represents a heading extracted from MDX content
 */
export type MdxHeading = {
	/** The heading level (1 for h1, 2 for h2, etc.) */
	level: 1 | 2
	/** The text content of the heading */
	text: string
	/** The slugified ID for the heading */
	id: string
}

/**
 * Parses h1 and h2 headings from MDX content
 *
 * Extracts heading text and generates slugified IDs for use in table of contents
 * or navigation. Only extracts h1 and h2 level headings.
 *
 * @param mdxContent - The raw MDX string content to parse
 * @returns Array of heading objects with level, text, and id
 *
 * @example
 * ```ts
 * const mdx = `# Introduction\n\n## Getting Started\n\n## Advanced Topics`
 * const headings = await parseMdxHeadings(mdx)
 * // [
 * //   { level: 1, text: 'Introduction', id: 'introduction' },
 * //   { level: 2, text: 'Getting Started', id: 'getting-started' },
 * //   { level: 2, text: 'Advanced Topics', id: 'advanced-topics' }
 * // ]
 * ```
 */
export async function parseMdxHeadings(
	mdxContent: string,
): Promise<MdxHeading[]> {
	const headings: MdxHeading[] = []

	const tree = await remark().use(remarkMdx).parse(mdxContent)

	visit(tree as Root, 'heading', (node: MdastHeading) => {
		if (node.depth === 1 || node.depth === 2) {
			const text = toString(node)
			const id = slugifyHeading(text)

			headings.push({
				level: node.depth as 1 | 2,
				text,
				id,
			})
		}
	})

	return headings
}
