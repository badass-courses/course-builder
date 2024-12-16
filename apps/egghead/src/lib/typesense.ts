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

const TypesenseResourceSchema = z.object({
	id: z.string(),
	externalId: z.string(),
	title: z.string(),
	slug: z.string(),
	summary: z.string(),
	state: z.string(),
	description: z.string(),
	name: z.string(),
	path: z.string(),
	type: z.string(),
	instructor_name: z.string(),
	instructor: z.object({
		full_name: z.string(),
	}),
	image: z.string(),
	published_at_timestamp: z.number(),
	updated_at_timestamp: z.number(),
})

export const attributeLabelMap: {
	[K in keyof z.infer<typeof TypesenseResourceSchema>]: string
} = {
	instructor_name: 'Instructor',
	description: 'Description',
	title: 'Title',
	summary: 'Summary',
	type: 'Type',
	state: 'State',
	externalId: 'External ID',
	id: 'ID',
	image: 'Image',
	instructor: 'Instructor',
	name: 'Name',
	path: 'Path',
	published_at_timestamp: 'Published At',
	updated_at_timestamp: 'Updated At',
	slug: 'Slug',
} as const

export type TypesenseResource = z.infer<typeof TypesenseResourceSchema>
export type TypesensePost = z.infer<typeof TypesensePostSchema>
