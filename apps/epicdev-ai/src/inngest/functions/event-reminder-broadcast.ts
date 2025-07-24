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

const SEND_TO_SUPPORT_EMAIL_ENABLED = true

/**
 * Smart event reminder scheduler
 * Runs early morning to schedule reminders, then sleeps until exact send time
 * Handles multiple reminder emails per event, each with different timing and content
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
		// Use UTC to match how event times are stored in database
		const today = new Date(
			Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
		)
		const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

		await log.info('event-reminder-broadcast.started', {
			timestamp: now.toISOString(),
		})

		// Get all email reminders that need scheduling today (each email reminder is processed separately)
		const remindersToSchedule = await step.run(
			'get-reminders-to-schedule',
			async () => {
				return await getRemindersNeedingScheduling(now, tomorrow)
			},
		)

		if (remindersToSchedule.length === 0) {
			await log.info('event-reminder-broadcast.no-reminders-to-schedule', {
				timestamp: now.toISOString(),
			})
			return { scheduled: 0, sent: 0, reminders: [] }
		}

		await log.info('event-reminder-broadcast.scheduling-reminders', {
			timestamp: now.toISOString(),
			remindersToSchedule: remindersToSchedule.length,
			uniqueEvents: [...new Set(remindersToSchedule.map((r) => r.event.id))]
				.length,
		})

		// Process each reminder email that needs to be scheduled
		const results = []

		for (const reminderData of remindersToSchedule) {
			// First, wait until the reminder time
			await step.sleepUntil(
				`wait-for-reminder-${reminderData.event.id}-${reminderData.emailResource.id}`,
				reminderData.reminderTime,
			)

			// Then send the reminder
			const result = await step.run(
				`send-reminder-${reminderData.event.id}-${reminderData.emailResource.id}`,
				async () => {
					return await sendEventReminder(reminderData as EventReminderData)
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
			scheduledReminders: remindersToSchedule.length,
			uniqueEvents: [...new Set(remindersToSchedule.map((r) => r.event.id))]
				.length,
			totalEmailsSent: totalSent,
			errors: errors.length,
		})

		return {
			scheduled: remindersToSchedule.length,
			sent: totalSent,
			reminders: results,
			errors,
		}
	},
)

/**
 * Get individual email reminders that need scheduling
 * Each reminder email is processed separately, allowing multiple emails per event
 */
async function getRemindersNeedingScheduling(
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

	const remindersNeedingScheduling: EventReminderData[] = []

	for (const ref of reminderEmailRefs) {
		const event = await getEvent(ref.resourceOfId)
		if (
			!event ||
			!event.fields.startsAt ||
			event.fields.state !== 'published'
		) {
			continue
		}

		const metadata = ref.metadata as any
		const hoursInAdvance = metadata?.hoursInAdvance

		if (!hoursInAdvance || typeof hoursInAdvance !== 'number') {
			await log.error('event-reminder-broadcast.invalid-hours-in-advance', {
				eventId: event.id,
				eventTitle: event.fields.title,
				emailId: ref.resourceId,
				hoursInAdvance: metadata?.hoursInAdvance,
			})
			continue // Skip this reminder, but continue processing others
		}

		const eventStartTime = new Date(event.fields.startsAt)
		const reminderTime = new Date(
			eventStartTime.getTime() - hoursInAdvance * 60 * 60 * 1000,
		)

		// Only schedule if reminder time is between now and tomorrow
		if (reminderTime >= now && reminderTime < tomorrow) {
			remindersNeedingScheduling.push({
				event: event,
				emailResource: ref.resource,
				hoursInAdvance,
				reminderTime: reminderTime.toISOString(),
				reminderRef: ref,
			})

			await log.info('event-reminder-broadcast.reminder-scheduled', {
				eventId: event.id,
				eventTitle: event.fields.title,
				emailId: ref.resourceId,
				emailTitle: ref.resource.fields?.title,
				hoursInAdvance,
				reminderTime: reminderTime.toISOString(),
			})
		}
	}

	// Sort reminders by time to ensure chronological processing
	return remindersNeedingScheduling.sort(
		(a, b) =>
			new Date(a.reminderTime).getTime() - new Date(b.reminderTime).getTime(),
	)
}

/**
 * Send event reminder emails to purchasers
 * Handles one specific reminder email for an event
 */
async function sendEventReminder(reminderData: EventReminderData) {
	try {
		const { event, emailResource, hoursInAdvance, reminderTime } = reminderData

		await log.info('event-reminder-broadcast.sending-reminder', {
			eventId: event.id,
			eventTitle: event.fields.title,
			emailId: emailResource.id,
			emailTitle: emailResource.fields?.title,
			eventStartsAt: event.fields.startsAt,
			reminderTime: reminderTime,
			hoursInAdvance,
			actualSendTime: new Date().toISOString(),
		})

		// Get event purchasers
		let purchasers = await getEventPurchasers(event.id)

		if (purchasers.length === 0) {
			await log.info('event-reminder-broadcast.no-purchasers', {
				eventId: event.id,
				eventTitle: event.fields.title,
				emailId: emailResource.id,
			})
			return {
				eventId: event.id,
				emailId: emailResource.id,
				sent: 0,
				error: null,
			}
		}

		if (SEND_TO_SUPPORT_EMAIL_ENABLED) {
			// Add support email to the list of purchasers
			purchasers.push({
				id: 'support',
				email: env.NEXT_PUBLIC_SUPPORT_EMAIL,
				name: 'team',
			})
		}

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
				let parsedBody: string
				let parsedSubject: string

				try {
					parsedBody = await liquid.parseAndRender(emailBody, {
						event,
						title: event.fields.title,
						url: `${env.NEXT_PUBLIC_URL}${getResourcePath(event.type, event.fields.slug, 'view')}`,
						user: purchaser,
					})
					parsedSubject = await liquid.parseAndRender(emailSubject, {
						event,
						title: event.fields.title,
						user: purchaser,
					})
				} catch (templateError) {
					throw new Error(
						`Template parsing failed: ${templateError instanceof Error ? templateError.message : String(templateError)}`,
					)
				}

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
					emailId: emailResource.id,
					userId: purchaser.id,
					userEmail: purchaser.email,
				})
			} catch (emailError) {
				const errorMessage =
					emailError instanceof Error ? emailError.message : String(emailError)
				errors.push(`Failed to send to ${purchaser.email}: ${errorMessage}`)

				await log.error('event-reminder-broadcast.email-failed', {
					eventId: event.id,
					emailId: emailResource.id,
					userId: purchaser.id,
					userEmail: purchaser.email,
					error: errorMessage,
				})
			}
		}

		await log.info('event-reminder-broadcast.reminder-completed', {
			eventId: event.id,
			eventTitle: event.fields.title,
			emailId: emailResource.id,
			emailTitle: emailResource_typed?.fields?.title,
			sentCount,
			totalPurchasers: purchasers.length,
			errors: errors.length,
		})

		return {
			eventId: event.id,
			emailId: emailResource.id,
			sent: sentCount,
			error: errors.length > 0 ? errors.join('; ') : null,
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)

		await log.error('event-reminder-broadcast.reminder-failed', {
			eventId: reminderData.event.id,
			emailId: reminderData.emailResource.id,
			error: errorMessage,
			stack: error instanceof Error ? error.stack : undefined,
		})

		return {
			eventId: reminderData.event.id,
			emailId: reminderData.emailResource.id,
			sent: 0,
			error: errorMessage,
		}
	}
}
