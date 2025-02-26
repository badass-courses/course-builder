import { getEggheadResource, getEggheadUserProfile } from '@/lib/egghead'
import { Post, PostAction } from '@/lib/posts'
import { getCoursesForPost } from '@/lib/posts-query'

import { createTypesenseClient, getTypesenseCollectionName } from './client'
import { TypesenseInstructorSchema, TypesensePostSchema } from './types'

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
		await client
			.collections(collectionName)
			.documents(String(post.fields.eggheadLessonId))
			.delete()
			.catch((error: Error) => {
				console.error(error)
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
			.collections(collectionName)
			.documents()
			.upsert({
				...resource.data,
				...(action === 'publish' && {
					published_at_timestamp: post.updatedAt?.getTime() ?? Date.now(),
				}),
				updated_at_timestamp: post.updatedAt?.getTime() ?? Date.now(),
			})
			.catch((error: Error) => {
				console.error(error)
			})
	}
}
