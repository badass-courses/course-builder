import { EGGHEAD_LESSON_CREATED_EVENT } from '@/inngest/events/egghead/lesson-created'
import { inngest } from '@/inngest/inngest.server'
import { eggheadLessonSchema, getEggheadLesson } from '@/lib/egghead'
import type { EggheadLesson } from '@/lib/egghead'
import {
	sanityCollaboratorDocumentSchema,
	sanityCollaboratorReferenceObjectSchema,
	sanityVersionedSoftwareLibraryObjectSchema,
} from '@/lib/sanity-content'
import type {
	SanityCollaboratorDocument,
	SanityCollaboratorReferenceObject,
	SanityVersionedSoftwareLibraryObject,
} from '@/lib/sanity-content'
import {
	createSanityLesson,
	getSanityCollaborator,
	getSanitySoftwareLibrary,
} from '@/lib/sanity-content-query'

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
				return await Promise.all(
					lesson.topic_list.map(async (library: string) => {
						return sanityVersionedSoftwareLibraryObjectSchema.parse(
							await getSanitySoftwareLibrary(library),
						)
					}),
				)
			},
		)) as SanityVersionedSoftwareLibraryObject[]

		const sanityCollaboratorReferenceObject = (await step.run(
			'Get collaborator',
			async () => {
				return sanityCollaboratorReferenceObjectSchema.parse(
					await getSanityCollaborator(lesson.instructor.id),
				)
			},
		)) as SanityCollaboratorReferenceObject

		const sanityLesson = await step.run('Create lesson in sanity', async () => {
			return await createSanityLesson(
				lesson,
				sanityCollaboratorReferenceObject,
				versionedSoftwareLibraryReferences,
			)
		})
	},
)
