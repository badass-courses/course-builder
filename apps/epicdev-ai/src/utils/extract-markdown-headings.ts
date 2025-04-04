import slugify from '@sindresorhus/slugify'

export type MarkdownHeading = {
	level: number
	text: string
	slug: string
	items: MarkdownHeading[]
}

export function slugifyHeading(text: string) {
	return slugify(text, {
		decamelize: false,
		customReplacements: [
			['&', ''],
			['.', ''],
			['/', ''],
		],
	})
}

// Components whose content should be skipped during heading extraction
const SKIP_COMPONENTS = ['AISummary'] as const

/**
 * Removes content within specified component tags from markdown
 * @param markdown - The markdown content to process
 * @param componentName - Name of the component to remove content from
 * @returns Markdown with the component content removed
 */
function removeComponentContent(
	markdown: string,
	componentName: string,
): string {
	const regex = new RegExp(
		`<${componentName}[\\s\\S]*?<\\/${componentName}>`,
		'g',
	)
	return markdown.replace(regex, '')
}

export const extractMarkdownHeadings = (
	markdown: string,
): MarkdownHeading[] => {
	// Remove content from all components that should be skipped
	const processedMarkdown = SKIP_COMPONENTS.reduce(
		(content, component) => removeComponentContent(content, component),
		markdown,
	)

	const headingRegex = /(^#{1,6}) (.+)/gm
	let match
	const stack: MarkdownHeading[] = [{ level: 0, text: '', slug: '', items: [] }] // Initialize stack with a dummy heading
	const slugMap: Map<string, number> = new Map() // Map to store each slug and its current index

	while ((match = headingRegex.exec(processedMarkdown)) !== null) {
		const level = match?.[1]?.length
		const text = match?.[2]?.trim()
		if (!level || !text || text.startsWith('!!')) {
			continue
		}
		let slug = slugifyHeading(text)

		// If the slug already exists in the map, append the current index to it
		if (slugMap.has(slug)) {
			const currentIndex = slugMap.get(slug)!
			slugMap.set(slug, currentIndex + 1)
			slug = `${slug}-${currentIndex}`
		} else {
			slugMap.set(slug, 1)
		}

		const heading: MarkdownHeading = { level, text, slug, items: [] }

		// @ts-expect-error
		while (stack.length > 0 && level <= stack[stack.length - 1].level) {
			stack.pop()
		}

		stack[stack.length - 1]?.items.push(heading)
		stack.push(heading)
	}

	return stack[0]?.items ?? []
}

export function flattenMarkdownHeadings(toc: MarkdownHeading[]) {
	return toc.flatMap((h) => [h.slug, ...h.items.flatMap((item) => item.slug)])
}
