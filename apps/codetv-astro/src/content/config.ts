import { defineCollection, z } from 'astro:content'

const blog = defineCollection({
	type: 'content',
	schema: z.object({
		draft: z.boolean().default(false).optional(),
		pubDate: z.date(),
		updated: z.date().optional(),
		title: z.string(),
		description: z.string(),
		share: z
			.object({
				title: z.string().optional(),
				image: z.string().url().optional(),
				text: z.string().optional(),
			})
			.optional(),
		showOptin: z.boolean().default(true).optional(),
	}),
})

export const collections = {
	blog,
}
