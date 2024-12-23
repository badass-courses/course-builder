import { EGGHEAD_COURSE_CREATED_EVENT } from '@/inngest/events/egghead/course-created'
import { POST_CREATED_EVENT } from '@/inngest/events/post-created'
import { inngest } from '@/inngest/inngest.server'
import { SanityCourseSchema } from '@/lib/sanity-content'
import {
	createSanityCourse,
	getSanityCollaborator,
} from '@/lib/sanity-content-query'
import { loadEggheadInstructorForUser } from '@/lib/users'
import { NonRetriableError } from 'inngest'

export const createCourseInSanity = inngest.createFunction(
	{
		id: 'create-course-in-sanity',
		name: 'Create Course in Sanity',
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

		const contributor = await step.run('get-contributor', async () => {
			const instructor = await loadEggheadInstructorForUser(post.createdById)

			if (!instructor) {
				return null
			}

			const contributor = await getSanityCollaborator(instructor.id)

			return contributor
		})

		const courseCreatedEvent = await step.waitForEvent(
			`wait for course created in egghead-rails`,
			{
				event: EGGHEAD_COURSE_CREATED_EVENT,
				timeout: '3 mins',
			},
		)

		if (!courseCreatedEvent) {
			throw new NonRetriableError('Course not created in egghead')
		}

		const courseId = courseCreatedEvent.data.id

		const sanityCourse = await step.run('create-course', async () => {
			const { fields } = post

			const courseGuid = fields?.slug.split('~').pop()

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
				sharedId: courseGuid,
				railsCourseId: courseId,
			})

			if (!coursePayload.success) {
				throw new NonRetriableError('Failed to create course in sanity', {
					cause: coursePayload.error.flatten().fieldErrors,
				})
			}

			const course = await createSanityCourse(coursePayload.data)

			return course
		})
	},
)
