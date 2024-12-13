import { POST_CREATED_EVENT } from '@/inngest/events/post-created'
import { inngest } from '@/inngest/inngest.server'
import { SanityCourseSchema } from '@/lib/sanity-content'
import { createCourse, getSanityCollaborator } from '@/lib/sanity-content-query'
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

		const sanityCourse = await step.run('create-course', async () => {
			const { fields } = post

			const coursePayload = SanityCourseSchema.safeParse({
				title: fields?.title,
				slug: {
					current: fields?.slug,
					_type: 'slug',
				},
				description: fields?.body,
				railsCourseId: fields?.railsCourseId,
				collaborators: [contributor],
				searchIndexingState: 'hidden',
				accessLevel: 'pro',
				productionProcessState: 'new',
				sharedId: post.id,
			})

			if (!coursePayload.success) {
				throw new NonRetriableError('Failed to create course in sanity', {
					cause: coursePayload.error.flatten().fieldErrors,
				})
			}

			const course = await createCourse(coursePayload.data)

			return course
		})
	},
)
