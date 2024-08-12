import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { EventSchema } from '@/lib/events'
import { and, eq, or, sql } from 'drizzle-orm'

export async function getEvent(eventIdOrSlug: string) {
	const eventData = await db.query.contentResource.findFirst({
		where: and(
			eq(contentResource.type, 'event'),
			or(
				eq(contentResource.id, eventIdOrSlug),
				eq(
					sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
					eventIdOrSlug,
				),
			),
		),
		with: {
			resources: true,
			resourceProducts: {
				with: {
					product: {
						with: {
							price: true,
						},
					},
				},
			},
		},
	})

	const parsedEvent = EventSchema.safeParse(eventData)
	if (!parsedEvent.success) {
		console.error('Error parsing event', eventData)
		return null
	}

	return parsedEvent.data
}
