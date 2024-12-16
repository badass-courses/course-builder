import { POST_CREATED_EVENT } from '@/inngest/events/post-created'
import { inngest } from '@/inngest/inngest.server'
import { createEggheadCourse } from '@/lib/egghead'
import { loadEggheadInstructorForUser } from '@/lib/users'
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
				return null
			}

			return instructor
		})

		const course = await step.run('create-course', async () => {
			const { fields } = post
		})
	},
)
