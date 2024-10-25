import Typesense from 'typesense'

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
		const resource = {
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
