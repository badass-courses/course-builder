import { unstable_cache } from 'next/cache'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { EventSchema } from '@/lib/events'
import { getSoldOutOrPastEventIds } from '@/lib/events-query'
import type { Tag } from '@/lib/tags'
import { zonedTimeToUtc } from 'date-fns-tz'
import { and, asc, desc, eq, or, sql } from 'drizzle-orm'

export const getCachedLiveWorkshopsPerTag = unstable_cache(
	async (tags: Tag[]) => getLiveWorkshopsPerTag(tags),
	['live-workshops'],
	{ revalidate: 3600, tags: ['live-workshops'] },
)

export async function getLiveWorkshopsPerTag(tags: Tag[]) {
	const allEvents = await db.query.contentResource.findMany({
		where: and(
			or(eq(contentResource.type, 'event')),
			eq(sql`JSON_EXTRACT (${contentResource.fields}, "$.state")`, 'published'),
		),
		with: {
			tags: {
				with: {
					tag: true,
				},
			},
		},
		orderBy: asc(sql`JSON_EXTRACT (${contentResource.fields}, "$.startsAt")`),
	})

	// Filter events that have all the required tags
	const events = allEvents.filter((event) =>
		tags.every((tag) =>
			event.tags.some((eventTag) => eventTag.tag.id === tag.id),
		),
	)
	const parsedEvents = EventSchema.array().parse(events)

	const now = new Date()
	const soldOutOrPastIds = await getSoldOutOrPastEventIds()

	// Filter events into past and upcoming
	const pastEvents = parsedEvents.filter((event) => {
		if (!event.fields?.startsAt) return false
		const timezone = event.fields?.timezone ?? 'America/Los_Angeles'
		const eventTimeInUTC = zonedTimeToUtc(
			new Date(event.fields.startsAt),
			timezone,
		)
		return eventTimeInUTC < now
	})

	const upcomingEvents = parsedEvents.filter((event) => {
		if (!event.fields?.startsAt) return false
		if (event.fields.visibility !== 'public') return false

		const timezone = event.fields?.timezone ?? 'America/Los_Angeles'
		const eventTimeInUTC = zonedTimeToUtc(
			new Date(event.fields.startsAt),
			timezone,
		)
		return eventTimeInUTC >= now
	})

	return { pastEvents, upcomingEvents, soldOutOrPastIds }
}
