import { z } from 'zod'

export const EGGHEAD_COURSE_CREATED_EVENT = 'egghead/course-created'

export type EggheadCourseCreated = {
	name: typeof EGGHEAD_COURSE_CREATED_EVENT
	data: EggheadCourseCreatedEvent
}
export const EggheadCourseCreatedEventSchema = z.object({
	id: z.number(),
})

export type EggheadCourseCreatedEvent = z.infer<
	typeof EggheadCourseCreatedEventSchema
>
