import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { COURSE_POST_CREATED_EVENT } from '@/inngest/events/course-post-created'
import { inngest } from '@/inngest/inngest.server'
import { createEggheadCourse } from '@/lib/egghead'
import { SanityCourseSchema } from '@/lib/sanity-content'
import {
	createCourse as createSanityCourse,
	getSanityCollaborator,
} from '@/lib/sanity-content-query'
import { loadEggheadInstructorForUser } from '@/lib/users'
import { eq } from 'drizzle-orm'
import { NonRetriableError } from 'inngest'

export const createCourseInEgghead = inngest.createFunction(
	{
		id: 'create-course-in-egghead',
		name: 'Create Course in Egghead',
	},
	{
		event: COURSE_POST_CREATED_EVENT,
	},
	async ({ event, step }) => {
		const post = await step.run('verify-post', async () => {
			const { post } = event.data
			if (!post) {
				throw new NonRetriableError('Post not found')
			}

			if (post.fields?.postType !== 'course') {
				throw new NonRetriableError('Post is not a course')
			}

			return post
		})

		const instructor = await step.run('get-instructor', async () => {
			const instructor = await loadEggheadInstructorForUser(post.createdById)

			return instructor
		})

		if (!instructor) {
			throw new NonRetriableError('Instructor not found', {
				cause: {
					postId: post.id,
					instructorId: post.createdById,
				},
			})
		}

		const courseGuid = post.fields?.slug.split('~').pop() ?? ''

		const eggheadCourse = await step.run('create-egghead-course', async () => {
			return await createEggheadCourse({
				title: post.fields?.title,
				guid: courseGuid,
				ownerId: instructor.user_id,
			})
		})

		await step.run('sync-course-id-to-builder', async () => {
			await db
				.update(contentResource)
				.set({
					fields: {
						...post.fields,
						eggheadCourseId: eggheadCourse.id,
					},
				})
				.where(eq(contentResource.id, post.id))
				.catch((error) => {
					console.error('🚨 Error creating post', error)
					throw error
				})
		})

		const sanityContributor = await step.run(
			'get-sanity-contributor',
			async () => {
				const contributor = await getSanityCollaborator(instructor.id)

				if (!contributor) {
					throw new NonRetriableError('Sanity contributor not found', {
						cause: {
							postId: post.id,
							instructorId: instructor.id,
						},
					})
				}

				return contributor
			},
		)

		const sanityCourse = await step.run('create-course', async () => {
			const { fields } = post

			const coursePayload = SanityCourseSchema.safeParse({
				title: fields?.title,
				slug: {
					current: fields?.slug,
					_type: 'slug',
				},
				description: fields?.body,
				collaborators: [sanityContributor],
				searchIndexingState: 'hidden',
				accessLevel: 'pro',
				productionProcessState: 'new',
				sharedId: courseGuid,
				railsCourseId: eggheadCourse.id,
			})

			if (!coursePayload.success) {
				throw new NonRetriableError('Failed to create course in sanity', {
					cause: coursePayload.error.flatten().fieldErrors,
				})
			}

			return await createSanityCourse(coursePayload.data)
		})

		return {
			eggheadCourse,
			sanityCourse,
		}
	},
)
