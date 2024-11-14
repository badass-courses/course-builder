import { eggheadPgQuery } from '@/db/eggheadPostgres'
import { EGGHEAD_LESSON_CREATED_EVENT } from '@/inngest/events/egghead/lesson-created'
import { inngest } from '@/inngest/inngest.server'
import { getEggheadLesson } from '@/lib/egghead'
import { createClient } from '@sanity/client'

export const sanityWriteClient = createClient({
	projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
	dataset: process.env.NEXT_PUBLIC_SANITY_DATASET_ID || 'production',
	useCdn: false, // `false` if you want to ensure fresh data
	apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
	token: process.env.SANITY_EDITOR_TOKEN,
})

/*
export const EggheadLessonCreatedEventSchema = z.object({
	id: z.number(),
})
*/

const keyGenerator = () => {
	return [...Array(12)]
		.map(() => Math.floor(Math.random() * 16).toString(16))
		.join('')
}

export const syncLessonToSanity = inngest.createFunction(
	{
		id: 'sync-lesson-to-sanity',
		name: 'Sync Lesson to Sanity',
	},
	{
		event: EGGHEAD_LESSON_CREATED_EVENT,
	},
	async ({ event, step }) => {
		const lesson = await step.run('Get lesson', async () => {
			return await getEggheadLesson(event.data.id)
		})

		const softwareLibraries = await step.run(
			'Get software libraries',
			async () => {
				const libraries = await Promise.all(
					lesson.topic_list.map(async (library: string) => {
						const libraryData = await sanityWriteClient.fetch(
							`*[_type == "software-library" && slug.current == "${library}"][0]`,
						)
						if (!libraryData) {
							return null
						}
						return {
							_key: keyGenerator(),
							_type: 'versioned-software-library',
							library: {
								_type: 'reference',
								_ref: libraryData._id,
							},
						}
					}),
				)
				return libraries
			},
		)

		const collaborators = await step.run('Get collaborators', async () => {
			const instructor = await sanityWriteClient.fetch(
				`*[_type == "collaborator" && eggheadInstructorId == "${lesson.instructor.id}"][0]`,
			)

			if (!instructor) {
				return null
			}

			return [
				{
					_key: keyGenerator(),
					_type: 'reference',
					_ref: instructor._id,
				},
			]
		})

		const sanityLesson = await step.run('Create lesson in sanity', async () => {
			return await sanityWriteClient.create({
				_type: 'lesson',
				title: lesson.title,
				slug: {
					_type: 'slug',
					current: lesson.slug,
				},
				description: lesson.summary,
				railsLessonId: lesson.id,
				softwareLibraries,
				status: lesson.state,
				accessLevel: lesson.free_forever ? 'free' : 'pro',
				collaborators,
			})
		})
	},
)
