import { EGGHEAD_LESSON_CREATED_EVENT } from '@/inngest/events/egghead/lesson-created'
import { inngest } from '@/inngest/inngest.server'
import { eggheadLessonSchema, getEggheadLesson } from '@/lib/egghead'
import type { EggheadLesson } from '@/lib/egghead'
import {
	sanityVersionedSoftwareLibraryObjectSchema,
	type SanityVersionedSoftwareLibraryObject,
} from '@/lib/sanity-content'
import {
	createSanityLesson,
	getSanitySoftwareLibrary,
} from '@/lib/sanity-content-query'
import { getSanityCollaborator } from '@/lib/sanity/collaborator/queries'
import { sanityReferenceSchema } from '@/lib/sanity/utils/schemas'
import type { SanityReference } from '@/lib/sanity/utils/schemas'

export const syncLessonToSanity = inngest.createFunction(
	{
		id: 'sync-lesson-to-sanity',
		name: 'Sync Lesson to Sanity',
	},
	{
		event: EGGHEAD_LESSON_CREATED_EVENT,
	},
	async ({ event, step }) => {
		const lesson = (await step.run('Get lesson', async () => {
			return eggheadLessonSchema.parse(await getEggheadLesson(event.data.id))
		})) as EggheadLesson

		const versionedSoftwareLibraryReferences = (await step.run(
			'Get an array of versioned software library references',
			async () => {
				try {
					return await Promise.all(
						lesson.topic_list.map(async (library: string) => {
							return sanityVersionedSoftwareLibraryObjectSchema.parse(
								await getSanitySoftwareLibrary(library),
							)
						}),
					)
				} catch (error) {
					console.error('Error getting software libraries', error)
					return []
				}
			},
		)) as SanityVersionedSoftwareLibraryObject[]

		const sanityCollaboratorReferenceObject = (await step.run(
			'Get collaborator',
			async () => {
				return sanityReferenceSchema?.parse(
					await getSanityCollaborator(lesson.instructor.id),
				)
			},
		)) as SanityReference

		const sanityLesson = await step.run('Create lesson in sanity', async () => {
			return await createSanityLesson(
				lesson,
				sanityCollaboratorReferenceObject,
				versionedSoftwareLibraryReferences,
			)
		})
	},
)
