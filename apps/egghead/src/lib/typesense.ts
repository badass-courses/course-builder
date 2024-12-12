import Typesense from 'typesense'
import { z } from 'zod'

import { getEggheadLesson } from './egghead'
import { Post, PostAction } from './posts'

export async function upsertPostToTypeSense(post: Post, action: PostAction) {
	let client = new Typesense.Client({
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

	const shouldIndex =
		post.fields.state === 'published' && post.fields.visibility === 'public'

	if (!shouldIndex) {
		await client
			.collections(process.env.TYPESENSE_COLLECTION_NAME!)
			.documents(String(post.fields.eggheadLessonId))
			.delete()
			.catch((err) => {
				console.error(err)
			})
	} else {
		if (!post.fields.eggheadLessonId) {
			return
		}
		const lesson = await getEggheadLesson(post.fields.eggheadLessonId)
		const resource: TypesenseResource = {
			id: `${post.fields.eggheadLessonId}`,
			externalId: post.id,
			title: post.fields.title,
			slug: post.fields.slug,
			summary: post.fields.description,
			description: post.fields.body,
			name: post.fields.title,
			path: `/${post.fields.slug}`,
			type: post.fields.postType,
			...(lesson && {
				instructor_name: lesson.instructor?.full_name,
				instructor: lesson.instructor,
				image: lesson.image_480_url,
			}),
		}
		await client
			.collections(process.env.TYPESENSE_COLLECTION_NAME!)
			.documents()
			.upsert({
				...resource,
				...(action === 'publish' && {
					published_at_timestamp: post.updatedAt?.getTime() ?? Date.now(),
				}),
				updated_at_timestamp: post.updatedAt?.getTime() ?? Date.now(),
			})
			.catch((err) => {
				console.error(err)
			})
	}
}

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

export type TypesenseResource = z.infer<typeof TypesenseResourceSchema>

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
