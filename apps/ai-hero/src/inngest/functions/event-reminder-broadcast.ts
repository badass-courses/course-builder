import { db } from '@/db'
import { contentResourceResource } from '@/db/schema'
import BasicEmail from '@/emails/basic-email'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import type { Email } from '@/lib/emails'
import type { Event } from '@/lib/events'
import { getEvent, getEventPurchasers } from '@/lib/events-query'
import { sendAnEmail } from '@/utils/send-an-email'
import { eq, sql } from 'drizzle-orm'
import { Liquid } from 'liquidjs'

import type { ContentResourceResource } from '@coursebuilder/core/schemas'

type EventReminderData = {
	event: Event
	emailResource: Pick<Email, 'id' | 'type' | 'fields'>
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
		cron: 'TZ=America/Los_Angeles 0 6 * * *',
	},
	async ({ step }) => {
		const now = new Date()
		const today = new Date(
			Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
		)
		const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

		const remindersToSchedule = await step.run(
			'get-reminders-to-schedule',
			async () => {
				return await getRemindersNeedingScheduling(now, tomorrow)
			},
		)

		if (remindersToSchedule.length === 0) {
			return { scheduled: 0, sent: 0, reminders: [] }
		}

		const results = []

		for (const reminderData of remindersToSchedule) {
			await step.sleepUntil(
				`wait-for-reminder-${reminderData.event.id}-${reminderData.emailResource.id}`,
				reminderData.reminderTime,
			)

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

		return {
			scheduled: remindersToSchedule.length,
			sent: totalSent,
			reminders: results,
			errors,
		}
	},
)

async function getRemindersNeedingScheduling(
	now: Date,
	tomorrow: Date,
): Promise<EventReminderData[]> {
	const reminderEmailRefs = await db.query.contentResourceResource.findMany({
		where: eq(
			sql`JSON_EXTRACT(${contentResourceResource.metadata}, "$.type")`,
			'event-reminder',
		),
		with: {
			resource: true,
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
			console.error('Invalid hoursInAdvance', {
				eventId: event.id,
				emailId: ref.resourceId,
				hoursInAdvance: metadata?.hoursInAdvance,
			})
			continue
		}

		const eventStartTime = new Date(event.fields.startsAt)
		const reminderTime = new Date(
			eventStartTime.getTime() - hoursInAdvance * 60 * 60 * 1000,
		)

		if (reminderTime >= now && reminderTime < tomorrow) {
			remindersNeedingScheduling.push({
				event,
				emailResource: ref.resource as unknown as Pick<
					Email,
					'id' | 'type' | 'fields'
				>,
				hoursInAdvance,
				reminderTime: reminderTime.toISOString(),
				reminderRef: ref as unknown as ContentResourceResource,
			})
		}
	}

	return remindersNeedingScheduling.sort(
		(a, b) =>
			new Date(a.reminderTime).getTime() -
			new Date(b.reminderTime).getTime(),
	)
}

async function sendEventReminder(reminderData: EventReminderData) {
	try {
		const { event, emailResource, hoursInAdvance, reminderTime } =
			reminderData

		let purchasers = await getEventPurchasers(event.id)

		if (purchasers.length === 0) {
			return {
				eventId: event.id,
				emailId: emailResource.id,
				sent: 0,
				error: null,
			}
		}

		if (SEND_TO_SUPPORT_EMAIL_ENABLED) {
			purchasers.push({
				id: 'support',
				email: env.NEXT_PUBLIC_SUPPORT_EMAIL,
				name: 'team',
			})
		}

		const liquid = new Liquid()
		const emailResourceTyped = emailResource as Email

		const emailBody =
			emailResourceTyped?.fields?.body ||
			'Reminder: Your event is starting soon!'
		const emailSubject =
			emailResourceTyped?.fields?.subject ||
			`Tomorrow's ${event.fields.title} - Please Review Instructions First!`

		let sentCount = 0
		const errors: string[] = []

		for (const purchaser of purchasers) {
			try {
				let parsedBody: string
				let parsedSubject: string

				try {
					parsedBody = await liquid.parseAndRender(emailBody, {
						event,
						title: event.fields.title,
						url: `${env.NEXT_PUBLIC_URL}/events/${event.fields.slug}`,
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
			} catch (emailError) {
				const errorMessage =
					emailError instanceof Error
						? emailError.message
						: String(emailError)
				errors.push(
					`Failed to send to ${purchaser.email}: ${errorMessage}`,
				)
			}
		}

		return {
			eventId: event.id,
			emailId: emailResource.id,
			sent: sentCount,
			error: errors.length > 0 ? errors.join('; ') : null,
		}
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : String(error)

		return {
			eventId: reminderData.event.id,
			emailId: reminderData.emailResource.id,
			sent: 0,
			error: errorMessage,
		}
	}
}
