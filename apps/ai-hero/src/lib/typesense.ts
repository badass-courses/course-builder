import Typesense from 'typesense'
import * as z from 'zod'

export const typesenseWriteClient = new Typesense.Client({
	nodes: [
		{
			host: process.env.NEXT_PUBLIC_TYPESENSE_HOST!,
			port: 443,
			protocol: 'https',
		},
	],
	apiKey: process.env.TYPESENSE_WRITE_API_KEY!,
	connectionTimeoutSeconds: 2,
})

export const TypesenseResourceSchema = z.object({
	id: z.string(),
	title: z.string(),
	slug: z.string(),
	state: z.string(),
	description: z.string(),
	visibility: z.string(),
	type: z.string(),
	published_at_timestamp: z.number().optional(),
	updated_at_timestamp: z.number().optional(),
	created_at_timestamp: z.number().optional(),
})

export const attributeLabelMap: {
	[K in keyof z.infer<typeof TypesenseResourceSchema>]: string
} = {
	description: 'Description',
	title: 'Title',
	type: 'Type',
	state: 'State',
	visibility: 'External ID',
	id: 'ID',
	slug: 'Slug',
	published_at_timestamp: 'Published At',
	updated_at_timestamp: 'Updated At',
	created_at_timestamp: 'Created At',
} as const

export type TypesenseResource = z.infer<typeof TypesenseResourceSchema>
