import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { EGGHEAD_COURSE_CREATED_EVENT } from '@/inngest/events/egghead/course-created'
import { POST_CREATED_EVENT } from '@/inngest/events/post-created'
import { inngest } from '@/inngest/inngest.server'
import { createEggheadCourse } from '@/lib/egghead'
import { loadEggheadInstructorForUser } from '@/lib/users'
import { eq } from 'drizzle-orm'
import { NonRetriableError } from 'inngest'

export const createCourseInEgghead = inngest.createFunction(
	{
		id: 'create-course-in-egghead',
		name: 'Create Course in Egghead',
	},
	{
		event: POST_CREATED_EVENT,
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

			if (!instructor) {
				throw new NonRetriableError('Instructor not found', {
					cause: {
						postId: post.id,
						instructorId: post.createdById,
					},
				})
			}

			return instructor
		})

		const course = await step.run('create-course', async () => {
			const courseGuid = post.fields?.slug.split('~').pop()

			const course = await createEggheadCourse({
				title: post.fields?.title,
				guid: courseGuid,
				ownerId: instructor.user_id,
			})

			return course
		})

		step.sendEvent(EGGHEAD_COURSE_CREATED_EVENT, {
			name: EGGHEAD_COURSE_CREATED_EVENT,
			data: {
				id: course.id,
			},
		})

		await step.run('sync-course-id-to-builder', async () => {
			await db
				.update(contentResource)
				.set({
					fields: {
						...post.fields,
						eggheadCourseId: course.id,
					},
				})
				.where(eq(contentResource.id, post.id))
				.catch((error) => {
					console.error('🚨 Error creating post', error)
					throw error
				})
		})
	},
)
