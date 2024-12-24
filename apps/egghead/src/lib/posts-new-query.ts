import { courseBuilderAdapter, db } from '@/db'
import {
	contentContributions,
	contentResource,
	contentResourceResource,
	contributionTypes,
} from '@/db/schema'
import { Post } from '@/lib/posts'
import { sanityWriteClient } from '@/server/sanity-write-client'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { createEggheadCourse, createEggheadLesson } from './egghead'
import {
	DatabaseError,
	ExternalServiceError,
	PostCreationError,
} from './errors/post-errors'
import { getPost } from './posts-query'
import { createNewPostVersion } from './posts-version-query'
import {
	SanityCourseSchema,
	SanityLessonDocumentSchema,
} from './sanity-content'
import {
	createSanityCourse,
	getSanityCollaborator,
	replaceSanityLessonResources,
	updateSanityLesson,
} from './sanity-content-query'
import { loadEggheadInstructorForUser } from './users'

const NewPostInputSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	videoResourceId: z.string().optional(),
	postType: z.enum([
		'lesson',
		'podcast',
		'tip',
		'course',
		'playlist',
		'article',
	]),
	eggheadInstructorId: z.number(),
	createdById: z.string(),
})

export type NewPostInput = z.infer<typeof NewPostInputSchema>

const TYPES_WITH_LESSONS = ['lesson', 'podcast', 'tip']
const TYPES_WITH_PLAYLISTS = ['course', 'playlist']

export async function writeNewPostToDatabase(
	input: NewPostInput,
): Promise<Post> {
	try {
		const validatedInput = NewPostInputSchema.parse(input)
		const {
			title,
			videoResourceId,
			postType,
			eggheadInstructorId,
			createdById,
		} = validatedInput

		const postGuid = guid()
		const newPostId = `post_${postGuid}`

		// Step 1: Get video resource if needed
		let videoResource = null
		if (videoResourceId) {
			try {
				videoResource =
					await courseBuilderAdapter.getVideoResource(videoResourceId)
			} catch (error) {
				throw new ExternalServiceError(
					'egghead',
					'fetch video resource',
					error,
					{ videoResourceId },
				)
			}
		}

		// Step 2: Create external resources (egghead lesson/playlist + Sanity doc)
		const { eggheadLessonId, eggheadPlaylistId } =
			await createExternalResources({
				title,
				postGuid,
				postType,
				eggheadInstructorId,
				videoResource,
			})

		try {
			// Step 3: Create the core post
			const post = await createCorePost({
				newPostId,
				title,
				postGuid,
				postType,
				createdById,
				eggheadLessonId,
				eggheadPlaylistId,
			})

			// Step 4: Handle contributions
			await handleContributions({
				createdById,
				postId: post.id,
				postGuid,
			})

			// Step 5: Update external systems
			await updateExternalSystems({
				post,
				postType,
				postGuid,
				eggheadLessonId,
				eggheadPlaylistId,
				videoResourceId,
				videoResource,
				createdById,
			})

			// Step 6: Create version
			await createNewPostVersion(post)

			return post
		} catch (error) {
			// If core post creation fails, clean up external resources
			await cleanupExternalResources({
				postType,
				eggheadLessonId,
				eggheadPlaylistId,
			})

			if (error instanceof PostCreationError) {
				throw error
			}

			throw new PostCreationError('Failed to create post', error, {
				input: validatedInput,
			})
		}
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new PostCreationError('Invalid input for post creation', error, {
				input,
			})
		}
		throw error
	}
}

async function createExternalResources({
	title,
	postGuid,
	postType,
	eggheadInstructorId,
	videoResource,
}: {
	title: string
	postGuid: string
	postType: string
	eggheadInstructorId: number
	videoResource: any
}) {
	const isLessonType = TYPES_WITH_LESSONS.includes(postType as any)
	const isPlaylistType = TYPES_WITH_PLAYLISTS.includes(postType as any)

	let eggheadLessonId: number | null = null
	let eggheadPlaylistId: number | null = null

	if (isLessonType) {
		try {
			eggheadLessonId = await createEggheadLesson({
				title,
				slug: `${slugify(title)}~${postGuid}`,
				instructorId: eggheadInstructorId,
				guid: postGuid,
				...(videoResource?.muxPlaybackId && {
					hlsUrl: `https://stream.mux.com/${videoResource.muxPlaybackId}.m3u8`,
				}),
			})

			if (!eggheadLessonId) {
				throw new Error('No lesson ID returned')
			}

			const lesson = SanityLessonDocumentSchema.parse({
				_id: `lesson-${eggheadLessonId}`,
				_type: 'lesson',
				title,
				accessLevel: 'pro',
				slug: {
					_type: 'slug',
					current: `${slugify(title)}~${postGuid}`,
				},
				railsLessonId: eggheadLessonId,
			})

			await sanityWriteClient.create(lesson)
		} catch (error) {
			throw new ExternalServiceError('egghead', 'create lesson', error, {
				title,
				postGuid,
			})
		}
	}

	if (isPlaylistType) {
		try {
			const playlist = await createEggheadCourse({
				title,
				guid: postGuid,
				ownerId: eggheadInstructorId,
			})

			if (!playlist) {
				throw new Error('No playlist returned')
			}

			eggheadPlaylistId = playlist.id
		} catch (error) {
			throw new ExternalServiceError('egghead', 'create playlist', error, {
				title,
				postGuid,
			})
		}
	}

	return { eggheadLessonId, eggheadPlaylistId }
}

async function createCorePost({
	newPostId,
	title,
	postGuid,
	postType,
	createdById,
	eggheadLessonId,
	eggheadPlaylistId,
}: {
	newPostId: string
	title: string
	postGuid: string
	postType: string
	createdById: string
	eggheadLessonId: number | null
	eggheadPlaylistId: number | null
}): Promise<Post> {
	try {
		await db.insert(contentResource).values({
			id: newPostId,
			type: 'post',
			createdById,
			fields: {
				title,
				state: 'draft',
				visibility: 'public',
				slug: `${slugify(title)}~${postGuid}`,
				postType,
				access: 'pro',
				...(eggheadLessonId ? { eggheadLessonId } : {}),
				...(eggheadPlaylistId ? { eggheadPlaylistId } : {}),
			},
		})

		const post = await getPost(newPostId)

		if (!post) {
			throw new Error('Post not found after creation')
		}

		return post
	} catch (error) {
		throw new DatabaseError('create core post', error, { newPostId, title })
	}
}

async function handleContributions({
	createdById,
	postId,
	postGuid,
}: {
	createdById: string
	postId: string
	postGuid: string
}) {
	try {
		const contributionType = await db.query.contributionTypes.findFirst({
			where: eq(contributionTypes.slug, 'author'),
		})

		if (contributionType) {
			await db.insert(contentContributions).values({
				id: `cc-${postGuid}`,
				userId: createdById,
				contentId: postId,
				contributionTypeId: contributionType.id,
			})
		}
	} catch (error) {
		throw new DatabaseError('handle contributions', error, {
			createdById,
			postId,
		})
	}
}

async function updateExternalSystems({
	post,
	postType,
	postGuid,
	eggheadLessonId,
	eggheadPlaylistId,
	videoResourceId,
	videoResource,
	createdById,
}: {
	post: Post
	postType: string
	postGuid: string
	eggheadLessonId: number | null
	eggheadPlaylistId: number | null
	videoResourceId?: string
	videoResource: any
	createdById: string
}) {
	const isLessonType = TYPES_WITH_LESSONS.includes(postType as any)
	const isPlaylistType = TYPES_WITH_PLAYLISTS.includes(postType as any)

	try {
		if (isLessonType && eggheadLessonId) {
			await Promise.all(
				[
					updateSanityLesson(eggheadLessonId, post),
					replaceSanityLessonResources({
						post,
						eggheadLessonId,
						videoResourceId,
					}),
					videoResource &&
						db
							.insert(contentResourceResource)
							.values({ resourceOfId: post.id, resourceId: videoResource.id }),
				].filter(Boolean),
			)
		}

		if (isPlaylistType && eggheadPlaylistId) {
			const instructor = await loadEggheadInstructorForUser(createdById)

			if (!instructor) {
				throw new Error(`egghead instructor not found [id: ${createdById}]`)
			}

			const contributor = await getSanityCollaborator(instructor.id)
			const { fields } = post
			const coursePayload = SanityCourseSchema.safeParse({
				title: fields?.title,
				slug: {
					current: fields?.slug,
					_type: 'slug',
				},
				description: fields?.body,
				collaborators: [contributor],
				searchIndexingState: 'hidden',
				accessLevel: 'pro',
				productionProcessState: 'new',
				sharedId: postGuid,
				railsCourseId: eggheadPlaylistId,
			})

			if (!coursePayload.success) {
				throw new Error('Invalid course payload', {
					cause: coursePayload.error.flatten().fieldErrors,
				})
			}

			await createSanityCourse(coursePayload.data)
		}
	} catch (error) {
		throw new ExternalServiceError('sanity', 'update external systems', error, {
			postId: post.id,
			postType,
		})
	}
}

async function cleanupExternalResources({
	postType,
	eggheadLessonId,
	eggheadPlaylistId,
}: {
	postType: string
	eggheadLessonId?: number | null
	eggheadPlaylistId?: number | null
}) {
	const isLessonType = TYPES_WITH_LESSONS.includes(postType)
	const isPlaylistType = TYPES_WITH_PLAYLISTS.includes(postType)

	try {
		if (isLessonType && eggheadLessonId) {
			// TODO: Implement egghead lesson cleanup
			console.log('Cleaning up egghead lesson:', eggheadLessonId)
		}

		if (isPlaylistType && eggheadPlaylistId) {
			// TODO: Implement egghead playlist cleanup
			console.log('Cleaning up egghead playlist:', eggheadPlaylistId)
		}
	} catch (error) {
		// Log cleanup errors but don't throw - we're already handling another error
		console.error('Failed to cleanup external resources:', error)
	}
}
