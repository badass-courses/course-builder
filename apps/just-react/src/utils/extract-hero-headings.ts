import { parseMdxHeadings, type MdxHeading } from './parse-mdx-headings'

export type HeroHeadings = {
	h1: MdxHeading | null
	h2: MdxHeading | null
	bodyWithoutHeadings: string
}

/**
 * Extracts h1 and optionally h2 from MDX content if they appear at the start
 *
 * Extracts h1 if it's the first non-empty line. Extracts h2 only if it
 * immediately follows h1 (no content between them). Returns the stripped
 * body content with those headings removed.
 *
 * @param mdxContent - The raw MDX string content
 * @returns Object containing h1, h2, and body content without those headings
 *
 * @example
 * ```ts
 * // With both h1 and h2
 * const mdx1 = `# Main Title\n\n## Subtitle\n\nContent here...`
 * const result1 = await extractHeroHeadings(mdx1)
 * // h1: { level: 1, text: 'Main Title', ... }
 * // h2: { level: 2, text: 'Subtitle', ... }
 *
 * // With only h1
 * const mdx2 = `# Main Title\n\nContent here...`
 * const result2 = await extractHeroHeadings(mdx2)
 * // h1: { level: 1, text: 'Main Title', ... }
 * // h2: null
 * ```
 */
export async function extractHeroHeadings(
	mdxContent: string,
): Promise<HeroHeadings> {
	const headings = await parseMdxHeadings(mdxContent)

	// Check if document starts with h1
	const lines = mdxContent.split('\n').filter((line) => line.trim())
	const firstH1Index = lines.findIndex((line) => line.match(/^#\s+/))
	const firstH2Index = lines.findIndex((line) => line.match(/^##\s+/))

	const hasH1 = headings[0]?.level === 1 && firstH1Index === 0
	const hasH2 = hasH1 && headings[1]?.level === 2 && firstH2Index === 1

	const h1 = hasH1 ? headings[0]! : null
	const h2 = hasH2 ? headings[1]! : null

	// Strip extracted headings from body
	let bodyContent = mdxContent
	if (hasH1) {
		const bodyLines = mdxContent.split('\n')

		// Remove first h1 line
		for (let i = 0; i < bodyLines.length; i++) {
			if (bodyLines[i]?.match(/^#\s+/)) {
				bodyLines.splice(i, 1)
				break
			}
		}

		// Remove first h2 line if it was extracted
		if (hasH2) {
			for (let i = 0; i < bodyLines.length; i++) {
				if (bodyLines[i]?.match(/^##\s+/)) {
					bodyLines.splice(i, 1)
					break
				}
			}
		}

		bodyContent = bodyLines.join('\n')
	}

	return {
		h1,
		h2,
		bodyWithoutHeadings: bodyContent,
	}
}
