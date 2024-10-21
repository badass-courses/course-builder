import Typesense from 'typesense'

import { Post } from './posts'

export async function upsertPostToTypeSense(post: Post) {
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
	}
}
