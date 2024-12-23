import { POST_CREATED_EVENT } from '@/inngest/events/post-created'
import { inngest } from '@/inngest/inngest.server'
import { PostSchema } from '@/lib/posts'

export const createCourseInEgghead = inngest.createFunction(
	{
		id: 'create-course-in-egghead',
		name: 'Create Course in Egghead',
	},
	{
		event: POST_CREATED_EVENT,
		if: 'event.data.post.fields?.postType == "course"',
	},
	async ({ event, step }) => {
		const post = await step.run('verify-post', async () => {
			return PostSchema.parse(event.data.post)
		})
	},
)
