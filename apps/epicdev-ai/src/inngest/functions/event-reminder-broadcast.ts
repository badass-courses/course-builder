import { db } from '@/db'
import { contentResourceResource } from '@/db/schema'
import BasicEmail from '@/emails/basic-email'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import type { Email } from '@/lib/emails'
import type { Event } from '@/lib/events'
import { getEvent, getEventPurchasers } from '@/lib/events-query'
import { log } from '@/server/logger'
import { sendAnEmail } from '@/utils/send-an-email'
import { and, eq, sql } from 'drizzle-orm'
import { Liquid } from 'liquidjs'

import type {
	ContentResource,
	ContentResourceResource,
} from '@coursebuilder/core/schemas'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

type EventReminderData = {
	event: Event
	emailResource: Pick<ContentResource, 'id' | 'type' | 'fields'>
	hoursInAdvance: number
	reminderTime: string
	reminderRef: ContentResourceResource
}

/**
 * Smart event reminder scheduler
 * Runs early morning to schedule reminders, then sleeps until exact send time
 */
export const eventReminderBroadcast = inngest.createFunction(
	{
		id: 'event-reminder-broadcast',
		name: 'Event Reminder Broadcast',
	},
	{
		cron: 'TZ=America/Los_Angeles 0 6 * * *', // Run daily at 6 AM Pacific to schedule reminders
	},
	async ({ step }) => {
		const now = new Date()
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
		const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

		await log.info('event-reminder-broadcast.started', {
			timestamp: now.toISOString(),
		})

		// Get all events with reminder emails that need scheduling today
		const eventsToSchedule = await step.run(
			'get-events-to-schedule',
			async () => {
				return await getEventsNeedingScheduling(now, tomorrow)
			},
		)

		if (eventsToSchedule.length === 0) {
			await log.info('event-reminder-broadcast.no-events-to-schedule', {
				timestamp: now.toISOString(),
			})
			return { scheduled: 0, sent: 0, events: [] }
		}

		await log.info('event-reminder-broadcast.scheduling-events', {
			timestamp: now.toISOString(),
			eventsToSchedule: eventsToSchedule.length,
		})

		// Process each event that needs a reminder scheduled
		const results = []

		for (const eventData of eventsToSchedule) {
			// First, wait until the reminder time
			await step.sleepUntil(
				`wait-for-reminder-${eventData.event.id}`,
				eventData.reminderTime,
			)

			// Then send the reminder
			const result = await step.run(
				`send-reminder-${eventData.event.id}`,
				async () => {
					return await sendEventReminder(eventData as EventReminderData)
				},
			)

			results.push(result)
		}

		const totalSent = results.reduce(
			(sum, result) => sum + (result.sent || 0),
			0,
		)
		const errors = results
			.filter((result) => result.error)
			.map((result) => result.error)

		await log.info('event-reminder-broadcast.finished', {
			timestamp: new Date().toISOString(),
			scheduledEvents: eventsToSchedule.length,
			totalEmailsSent: totalSent,
			errors: errors.length,
		})

		return {
			scheduled: eventsToSchedule.length,
			sent: totalSent,
			events: results,
			errors,
		}
	},
)

/**
 * Get events that need reminder scheduling
 */
async function getEventsNeedingScheduling(
	now: Date,
	tomorrow: Date,
): Promise<EventReminderData[]> {
	const reminderEmailRefs = await db.query.contentResourceResource.findMany({
		where: and(
			eq(
				sql`JSON_EXTRACT (${contentResourceResource.metadata}, "$.type")`,
				'event-reminder',
			),
		),
		with: {
			resource: true, // The email resource
		},
	})

	const eventsNeedingScheduling: EventReminderData[] = []

	for (const ref of reminderEmailRefs) {
		const event = await getEvent(ref.resourceOfId)
		if (
			!event ||
			!event.fields.startsAt ||
			event.fields.state !== 'published' ||
			event.fields.visibility !== 'public'
		)
			continue

		const metadata = ref.metadata as any
		const hoursInAdvance = metadata?.hoursInAdvance || 24

		const eventStartTime = new Date(event.fields.startsAt)
		const reminderTime = new Date(
			eventStartTime.getTime() - hoursInAdvance * 60 * 60 * 1000,
		)

		// Only schedule if reminder time is between now and tomorrow
		if (reminderTime >= now && reminderTime < tomorrow) {
			eventsNeedingScheduling.push({
				event: event,
				emailResource: ref.resource,
				hoursInAdvance,
				reminderTime: reminderTime.toISOString(),
				reminderRef: ref,
			})
		}
	}

	return eventsNeedingScheduling
}

/**
 * Send event reminder emails to purchasers
 */
async function sendEventReminder(eventData: EventReminderData) {
	try {
		const { event, emailResource, hoursInAdvance, reminderTime } = eventData

		await log.info('event-reminder-broadcast.scheduling-reminder', {
			eventId: event.id,
			eventTitle: event.fields.title,
			eventStartsAt: event.fields.startsAt,
			reminderTime: reminderTime,
			hoursInAdvance,
		})

		await log.info('event-reminder-broadcast.sending-now', {
			eventId: event.id,
			eventTitle: event.fields.title,
			actualSendTime: new Date().toISOString(),
		})

		// Get event purchasers
		let purchasers = await getEventPurchasers(event.id)

		if (purchasers.length === 0) {
			await log.info('event-reminder-broadcast.no-purchasers', {
				eventId: event.id,
				eventTitle: event.fields.title,
			})
			return { eventId: event.id, sent: 0, error: null }
		}

		// Add support email to the list of purchasers
		purchasers.push({
			id: 'support',
			email: env.NEXT_PUBLIC_SUPPORT_EMAIL,
			name: 'Support',
		})

		// Parse email content with Liquid templating
		const liquid = new Liquid()
		const emailResource_typed = emailResource as Email

		const emailBody =
			emailResource_typed?.fields?.body ||
			'Reminder: Your event is starting soon!'
		const emailSubject =
			emailResource_typed?.fields?.subject ||
			`Tomorrow's ${event.fields.title} - Please Review Instructions First! 🚀`

		let sentCount = 0
		const errors: string[] = []

		// Send to each purchaser
		for (const purchaser of purchasers) {
			try {
				const parsedBody = await liquid.parseAndRender(emailBody, {
					event,
					title: event.fields.title,
					url: `${env.NEXT_PUBLIC_URL}${getResourcePath(event.type, event.fields.slug, 'view')}`,
					user: purchaser,
				})
				const parsedSubject = await liquid.parseAndRender(emailSubject, {
					event,
					title: event.fields.title,
					user: purchaser,
				})

				await sendAnEmail({
					Component: BasicEmail,
					componentProps: {
						body: parsedBody,
					},
					Subject: parsedSubject,
					To: purchaser.email,
					From: `${env.NEXT_PUBLIC_SITE_TITLE} <${env.NEXT_PUBLIC_SUPPORT_EMAIL}>`,
					type: 'transactional',
				})

				sentCount++

				await log.info('event-reminder-broadcast.email-sent', {
					eventId: event.id,
					userId: purchaser.id,
					userEmail: purchaser.email,
				})
			} catch (emailError) {
				const errorMessage =
					emailError instanceof Error ? emailError.message : String(emailError)
				errors.push(`Failed to send to ${purchaser.email}: ${errorMessage}`)

				await log.error('event-reminder-broadcast.email-failed', {
					eventId: event.id,
					userId: purchaser.id,
					userEmail: purchaser.email,
					error: errorMessage,
				})
			}
		}

		await log.info('event-reminder-broadcast.completed', {
			eventId: event.id,
			eventTitle: event.fields.title,
			sentCount,
			totalPurchasers: purchasers.length,
			errors: errors.length,
		})

		return {
			eventId: event.id,
			sent: sentCount,
			error: errors.length > 0 ? errors.join('; ') : null,
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)

		await log.error('event-reminder-broadcast.step-failed', {
			eventId: eventData.event.id,
			error: errorMessage,
			stack: error instanceof Error ? error.stack : undefined,
		})

		return {
			eventId: eventData.event.id,
			sent: 0,
			error: errorMessage,
		}
	}
}
