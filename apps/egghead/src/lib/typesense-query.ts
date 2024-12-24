import Typesense from 'typesense'

import { getEggheadLesson } from './egghead'
import { Post, PostAction } from './posts'
import { getPostTags } from './posts-query'
import { InstructorSchema, TypesensePostSchema } from './typesense'

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

		const instructor = InstructorSchema.parse({
			id: lesson.instructor?.id,
			name: lesson.instructor?.full_name,
			first_name: lesson.instructor?.first_name,
			last_name: lesson.instructor?.last_name,
			url: lesson.instructor?.url,
			avatar_url: lesson.instructor?.avatar_url,
		})

		const tags = await getPostTags(post.id)
		const primaryTag = tags.find((tag) => post?.fields?.primaryTagId === tag.id)
		const postGuid = post.id.split('_').pop()

		const resource = TypesensePostSchema.safeParse({
			id: `${post.fields.eggheadLessonId}`,
			externalId: postGuid,
			title: post.fields.title,
			slug: post.fields.slug,
			summary: post.fields.description,
			description: post.fields.body,
			name: post.fields.title,
			path: `/${post.fields.slug}`,
			type: post.fields.postType,
			_tags: tags.map((tag) => tag.fields.name),
			...(primaryTag && {
				primary_tag: primaryTag,
				...(primaryTag.fields?.image_url && {
					primary_tag_image_url: primaryTag.fields.image_url,
				}),
			}),
			...(lesson && {
				instructor_name: lesson.instructor?.full_name,
				instructor,
				image: lesson.image_480_url,
				published_at_timestamp: lesson.published_at
					? new Date(lesson.published_at).getTime()
					: null,
			}),
		})

		if (!resource.success) {
			console.error(resource.error)
			return
		}

		console.log('resource', resource.data)

		await client
			.collections(process.env.TYPESENSE_COLLECTION_NAME!)
			.documents()
			.upsert({
				...resource.data,
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
