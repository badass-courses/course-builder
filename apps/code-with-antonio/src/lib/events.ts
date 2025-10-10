import { z } from 'zod'

import { productSchema } from '@coursebuilder/core/schemas'
import {
	ContentResourceSchema,
	ResourceStateSchema,
	ResourceVisibilitySchema,
} from '@coursebuilder/core/schemas/content-resource-schema'

/**
 * @description Schema for time-bound events like workshops, webinars, and live sessions
 */
export const EventSchema = ContentResourceSchema.merge(
	z.object({
		fields: z.object({
			body: z.string().nullable().optional(),
			title: z.string().min(2).max(90),
			description: z.string().optional(),
			slug: z.string(),
			state: ResourceStateSchema.default('draft'),
			visibility: ResourceVisibilitySchema.default('unlisted'),
			startsAt: z.string().datetime().nullable().optional(),
			endsAt: z.string().datetime().nullable().optional(),
			timezone: z.string().default('America/Los_Angeles'),
			image: z.string().url().optional(),
			socialImage: z
				.object({
					type: z.string(),
					url: z.string().url(),
				})
				.optional(),
		}),
	}),
)

export type Event = z.infer<typeof EventSchema>

/**
 * @description Helper to create a new event with default values
 */
export const createEvent = (input: Partial<Event>): Event => {
	return {
		...input,
		type: 'event',
		fields: {
			...input.fields,
			state: input.fields?.state ?? 'draft',
			visibility: input.fields?.visibility ?? 'unlisted',
			timezone: input.fields?.timezone ?? 'America/Los_Angeles',
		},
	} as Event
}
