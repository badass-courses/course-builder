import { getEggheadResource, getEggheadUserProfile } from '@/lib/egghead'
import { Post, PostAction } from '@/lib/posts'
import { getCoursesForPost } from '@/lib/posts-query'

import { createTypesenseClient, getTypesenseCollectionName } from './client'
import {
	TypesenseInstructorSchema,
	TypesensePostSchema,
	type TypesensePost,
} from './types'

/**
 * Upsert a post to TypeSense or delete it if not indexable
 * @param post - The post to index
 * @param action - The action being performed (publish, save, etc.)
 */
export async function upsertPostToTypeSense(post: Post, action: PostAction) {
	const client = createTypesenseClient()
	const collectionName = getTypesenseCollectionName()

	const shouldIndex =
		post.fields.state === 'published' && post.fields.visibility === 'public'

	if (!shouldIndex) {
		try {
			await client
				.collections(collectionName)
				.documents(String(post.fields.eggheadLessonId))
				.delete()
		} catch (error) {
			console.error('Error deleting post from Typesense index:', error)
			// Still continue execution rather than failing the whole process
		}
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

		const resourceId = eggheadResource ? String(eggheadResource.id) : postGuid

		const resource = TypesensePostSchema.safeParse({
			id: resourceId,
			externalId: postGuid,
			title: post.fields.title,
			slug: post.fields.slug,
			summary: post.fields.description,
			description: post.fields.body,
			name: post.fields.title,
			path: `/${post.fields.slug}`,
			type: postType,
			image: post.fields.image || post.tags?.[0]?.tag?.fields?.image_url || '',
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
			...(eggheadResource?.published_at && {
				published_at_timestamp: eggheadResource.published_at
					? new Date(eggheadResource.published_at).getTime()
					: null,
			}),
			...(post.fields.postType === 'article' &&
				post?.createdAt && {
					published_at_timestamp: new Date(post?.createdAt).getTime(),
				}),
			belongs_to_resource:
				courses.length > 0 ? courses[0]?.eggheadPlaylistId : null,
			belongs_to_resource_title:
				courses.length > 0 ? courses[0]?.courseTitle : '',
			belongs_to_resource_slug:
				courses.length > 0 ? courses[0]?.courseSlug : '',
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

		try {
			// Check if collection exists first
			try {
				await client.collections(collectionName).retrieve()
			} catch (collectionError: any) {
				if (collectionError.httpStatus === 404) {
					console.error(
						`Typesense collection '${collectionName}' not found. Skipping index operation.`,
					)
					return // Exit early if collection doesn't exist
				}
				// For other errors, proceed and let the main operation try
			}

			await client
				.collections(collectionName)
				.documents()
				.upsert({
					...resource.data,
					...(action === 'publish' && {
						published_at_timestamp: post.updatedAt?.getTime() ?? Date.now(),
					}),
					updated_at_timestamp: post.updatedAt?.getTime() ?? Date.now(),
				})
		} catch (error: any) {
			console.error('Error upserting post to Typesense index:', error)

			// Check specific error codes
			const httpStatus =
				error.httpStatus ||
				(error.message && error.message.includes('404') ? 404 : null)

			if (httpStatus === 404) {
				console.error(
					'404 Not Found error. This may indicate the Typesense collection does not exist or is misconfigured.',
				)
			}

			// Still continue execution rather than failing the whole process
		}
	}
}

export async function updatePostInTypeSense(
	id: string,
	attributes: Partial<TypesensePost>,
) {
	const client = createTypesenseClient()

	return client
		.collections(process.env.TYPESENSE_COLLECTION_NAME!)
		.documents(id)
		.update(attributes)
}
