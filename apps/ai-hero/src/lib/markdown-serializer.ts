/**
 * Serialize content resource to markdown with YAML frontmatter
 * Used by /md/* routes to serve content to AI agents
 */
export function serializeToMarkdown(content: {
	id: string
	type: string
	fields: {
		title: string
		slug: string
		description?: string | null
		body?: string | null
	}
	tags?: { tag: { fields: { name: string; slug: string } } }[] | null
	updatedAt?: Date | string | null
}): string {
	const frontmatter = {
		title: content.fields.title,
		slug: content.fields.slug,
		type: content.type,
		...(content.fields.description && {
			description: content.fields.description,
		}),
		...(content.tags?.length && {
			tags: content.tags.map((t) => t.tag.fields.name),
		}),
		...(content.updatedAt && {
			updatedAt: new Date(content.updatedAt).toISOString(),
		}),
	}

	const yaml = Object.entries(frontmatter)
		.map(([k, v]) =>
			Array.isArray(v)
				? `${k}:\n${v.map((i) => `  - ${i}`).join('\n')}`
				: `${k}: "${v}"`,
		)
		.join('\n')

	return `---\n${yaml}\n---\n\n${content.fields.body || ''}`
}
