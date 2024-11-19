import { z } from 'zod'

export const EGGHEAD_LESSON_CREATED_EVENT = 'egghead/lesson-created'

export type EggheadLessonCreated = {
	name: typeof EGGHEAD_LESSON_CREATED_EVENT
	data: EggheadLessonCreatedEvent
}
export const EggheadLessonCreatedEventSchema = z.object({
	id: z.number(),
})

export type EggheadLessonCreatedEvent = z.infer<
	typeof EggheadLessonCreatedEventSchema
>
