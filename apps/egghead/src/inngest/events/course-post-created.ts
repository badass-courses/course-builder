import { z } from 'zod'

import {
	ContentResource,
	ContentResourceSchema,
} from '@coursebuilder/core/schemas'

export const COURSE_POST_CREATED_EVENT = 'course/post/created'

export type CoursePostCreated = {
	name: typeof COURSE_POST_CREATED_EVENT
	data: CoursePostCreatedEvent
}

export const CoursePostCreatedEventSchema = ContentResourceSchema.extend({
	fields: z.object({
		postType: z.literal('course'),
	}),
})

export type CoursePostCreatedEvent = z.infer<
	typeof CoursePostCreatedEventSchema
>
