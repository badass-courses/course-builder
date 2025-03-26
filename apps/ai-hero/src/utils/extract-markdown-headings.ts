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

export const extractMarkdownHeadings = (
	markdown: string,
): MarkdownHeading[] => {
	const headingRegex = /(^#{1,6}) (.+)/gm
	let match
	const stack: MarkdownHeading[] = [{ level: 0, text: '', slug: '', items: [] }] // Initialize stack with a dummy heading
	const slugMap: Map<string, number> = new Map() // Map to store each slug and its current index

	while ((match = headingRegex.exec(markdown)) !== null) {
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
		while (level <= stack[stack.length - 1]?.level) {
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
