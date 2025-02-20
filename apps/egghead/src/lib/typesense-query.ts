import Typesense from 'typesense'

import { getEggheadResource, getEggheadUserProfile } from './egghead'
import { Post, PostAction } from './posts'
import { getCoursesForPost } from './posts-query'
import { TypesenseInstructorSchema, TypesensePostSchema } from './typesense'

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
		// eggheadResource is either a lesson or a playlist
		const eggheadResource = await getEggheadResource(post)
		const eggheadUser = await getEggheadUserProfile(post.createdById)
		const typeSenseInstructor = TypesenseInstructorSchema.parse({
			id: eggheadUser.id,
			name: eggheadUser.full_name,
			first_name: eggheadUser.instructor?.first_name,
			last_name: eggheadUser.instructor?.last_name,
			url: eggheadUser.instructor?.website,
			avatar_url: eggheadUser.instructor?.avatar_url,
		})

		const primaryTagDbRow = post?.tags?.find(
			(tagRow) => post?.fields?.primaryTagId === tagRow.tagId,
		)
		const postGuid = post.id.split('_').pop()
		// typesense expects playlist for courses
		const postType =
			post.fields.postType === 'course' ? 'playlist' : post.fields.postType

		const courses = await getCoursesForPost(post.id)

		const resource = TypesensePostSchema.safeParse({
			id: String(eggheadResource.id),
			externalId: postGuid,
			title: post.fields.title,
			slug: post.fields.slug,
			summary: post.fields.description,
			description: post.fields.body,
			name: post.fields.title,
			path: `/${post.fields.slug}`,
			type: postType,
			image: post.fields.image || post.tags?.[0]?.tag?.fields?.image_url,
			_tags: post.tags?.map(({ tag }) => tag.fields?.name),
			...(primaryTagDbRow && {
				primary_tag: primaryTagDbRow.tag,
				...(primaryTagDbRow.tag.fields?.image_url && {
					primary_tag_image_url: primaryTagDbRow.tag.fields.image_url,
				}),
			}),
			...(eggheadUser && {
				instructor_name: eggheadUser.instructor?.full_name,
				instructor: typeSenseInstructor,
			}),
			...(eggheadResource.published_at && {
				published_at_timestamp: eggheadResource.published_at
					? new Date(eggheadResource.published_at).getTime()
					: null,
			}),
			belongs_to_resource:
				courses.length > 0 ? courses[0]?.eggheadPlaylistId : null,
			...(courses.length > 0 && {
				resources: courses.map((course) => ({
					id: course.courseId,
					title: course.courseTitle,
					slug: course.courseSlug,
					eggheadPlaylistId: course.eggheadPlaylistId,
				})),
			}),
		})

		if (!resource.success) {
			console.error(resource.error)
			throw new Error('Failed to parse lesson post for TypesensePostSchema')
		}

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
