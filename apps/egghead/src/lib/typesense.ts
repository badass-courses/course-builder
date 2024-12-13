import * as z from 'zod'

export const InstructorSchema = z.object({
	id: z.number().optional(),
	name: z.string().optional(),
	first_name: z.string().optional(),
	last_name: z.string().optional(),
	full_name: z.string().optional(),
	avatar_url: z.string().url().optional(),
})

export const TypesensePostSchema = z.object({
	type: z.string().optional(),
	id: z.string().optional(),
	name: z.string().optional(),
	title: z.string().optional(),
	slug: z.string().optional(),
	externalId: z.string().optional(),
	description: z.string().optional(),
	summary: z.string().optional(),
	image: z.string().optional(),
	_tags: z.array(z.string()).optional(),
	instructor: InstructorSchema.optional(),
	instructor_name: z.string().optional(),
	instructor_url: z.string().url().optional(),
	path: z.string().optional(),
	published_at_timestamp: z.number().nullish(),
})

export type TypesensePost = z.infer<typeof TypesensePostSchema>
