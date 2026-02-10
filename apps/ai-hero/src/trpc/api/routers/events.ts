import { db } from '@/db'
import { products, purchases } from '@/db/schema'
import BasicEmail from '@/emails/basic-email'
import { env } from '@/env.mjs'
import { NewEmailSchema } from '@/lib/emails'
import { getEmailSimple, updateEmailSimple } from '@/lib/emails-query'
import {
	attachReminderEmailToEvent,
	createAndAttachReminderEmailToEvent,
	detachReminderEmailFromEvent,
	getAllReminderEmails,
	getEvent,
	getEventPurchasers,
	getEventReminderEmails,
	updateReminderEmailHours,
} from '@/lib/events-query'
import { getServerAuthSession } from '@/server/auth'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import { sendAnEmail } from '@/utils/send-an-email'
import { count, desc, eq } from 'drizzle-orm'
import { Liquid } from 'liquidjs'
import { z } from 'zod'

export const eventsRouter = createTRPCRouter({
	get: publicProcedure.query(async ({ ctx }) => {
		const { session, ability } = await getServerAuthSession()
		const user = session?.user

		const liveProducts = await db.query.products.findMany({
			where: (products, { eq, and, gt, sql }) =>
				and(
					eq(products.type, 'live'),
					eq(products.status, 1),
					gt(products.quantityAvailable, 0),
				),
		})

		if (!liveProducts) {
			return []
		}

		const liveProductsWithQuantity = await Promise.all(
			liveProducts.map(async (product) => {
				const { count: purchaseCount } = await db
					.select({ count: count() })
					.from(purchases)
					.where(eq(purchases.productId, product.id))
					.then((res) => res[0] ?? { count: 0 })

				const productWithQuantityAvailable = await db
					.select({ quantityAvailable: products.quantityAvailable })
					.from(products)
					.where(eq(products.id, product.id))
					.then((res) => res[0])

				const contentResourceProduct =
					await db.query.contentResourceProduct.findFirst({
						where: (contentResourceProduct, { eq }) =>
							eq(contentResourceProduct.productId, product.id),
					})

				const contentResource = await db.query.contentResource.findFirst({
					where: (contentResource, { eq }) =>
						contentResourceProduct &&
						eq(contentResource.id, contentResourceProduct.resourceId),
				})

				let quantityAvailable = -1

				if (productWithQuantityAvailable) {
					quantityAvailable =
						productWithQuantityAvailable.quantityAvailable - purchaseCount
				}

				if (quantityAvailable < 0) {
					quantityAvailable = -1
				}

				let purchase

				if (user) {
					purchase = await db.query.purchases.findFirst({
						where: (purchases, { eq, and }) =>
							and(
								eq(purchases.userId, user.id),
								eq(purchases.productId, product.id),
							),
					})
				}

				return {
					...product,
					purchase,
					contentResource,
					quantityAvailable,
				}
			}),
		)

		return liveProductsWithQuantity
			.filter(
				(product) =>
					product.quantityAvailable > 0 &&
					product.contentResource?.fields?.visibility === 'public',
			)
			.sort((a, b) => {
				const dateA = new Date(a.contentResource?.fields?.startsAt || 0)
				const dateB = new Date(b.contentResource?.fields?.startsAt || 0)
				return dateA.getTime() - dateB.getTime()
			})
	}),
	getEventReminderEmails: publicProcedure
		.input(z.object({ eventId: z.string() }))
		.query(async ({ input }) => {
			return await getEventReminderEmails(input.eventId)
		}),
	getAllReminderEmails: publicProcedure.query(async () => {
		return await getAllReminderEmails()
	}),
	attachReminderEmailToEvent: publicProcedure
		.input(
			z.object({
				eventId: z.string(),
				emailId: z.string(),
				hoursInAdvance: z.number().optional().default(24),
			}),
		)
		.mutation(async ({ input }) => {
			return await attachReminderEmailToEvent(
				input.eventId,
				input.emailId,
				input.hoursInAdvance,
			)
		}),
	detachReminderEmailFromEvent: publicProcedure
		.input(
			z.object({
				eventId: z.string(),
				emailId: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			return await detachReminderEmailFromEvent(input.eventId, input.emailId)
		}),
	createAndAttachReminderEmailToEvent: publicProcedure
		.input(
			z.object({
				eventId: z.string(),
				input: NewEmailSchema,
				hoursInAdvance: z.number().optional().default(24),
			}),
		)
		.mutation(async ({ input }) => {
			return await createAndAttachReminderEmailToEvent(
				input.eventId,
				input.input,
				input.hoursInAdvance,
			)
		}),
	updateReminderEmailHours: publicProcedure
		.input(
			z.object({
				eventId: z.string(),
				emailId: z.string(),
				hoursInAdvance: z.number().min(1).max(168),
			}),
		)
		.mutation(async ({ input }) => {
			return await updateReminderEmailHours(
				input.eventId,
				input.emailId,
				input.hoursInAdvance,
			)
		}),
	updateReminderEmail: publicProcedure
		.input(
			z.object({
				emailId: z.string(),
				eventId: z.string(),
				hoursInAdvance: z.number().min(1).max(168),
				fields: NewEmailSchema.shape.fields,
			}),
		)
		.mutation(async ({ input }) => {
			const email = await getEmailSimple(input.emailId)
			if (!email) {
				throw new Error('Email not found')
			}

			if (input.hoursInAdvance) {
				await updateReminderEmailHours(
					input.eventId,
					input.emailId,
					input.hoursInAdvance,
				)
			}

			return await updateEmailSimple({
				...email,
				id: input.emailId,
				fields: {
					...email.fields,
					...input.fields,
				},
			})
		}),
	previewReminderEmail: publicProcedure
		.input(z.object({ eventId: z.string(), emailId: z.string() }))
		.query(async ({ input }) => {
			const event = await getEvent(input.eventId)
			if (!event) throw new Error('Event not found')

			const email = await getEmailSimple(input.emailId)
			if (!email) throw new Error('Email not found')

			const purchasers = await getEventPurchasers(input.eventId)

			const liquid = new Liquid()
			const sampleUser = purchasers[0] || {
				name: 'Attendee',
				email: 'attendee@example.com',
			}

			const renderedSubject = await liquid.parseAndRender(
				email.fields?.subject || '',
				{
					event,
					title: event.fields.title,
					url: `${env.NEXT_PUBLIC_URL}/events/${event.fields.slug}`,
					user: sampleUser,
				},
			)
			const renderedBody = await liquid.parseAndRender(
				email.fields?.body || '',
				{
					event,
					title: event.fields.title,
					url: `${env.NEXT_PUBLIC_URL}/events/${event.fields.slug}`,
					user: sampleUser,
				},
			)

			return {
				subject: renderedSubject,
				body: renderedBody,
				recipientCount: purchasers.length,
				recipients: purchasers.map((p) => ({
					name: p.name,
					email: p.email,
				})),
			}
		}),
	sendReminderEmailNow: publicProcedure
		.input(z.object({ eventId: z.string(), emailId: z.string() }))
		.mutation(async ({ input }) => {
			const event = await getEvent(input.eventId)
			if (!event) throw new Error('Event not found')

			const email = await getEmailSimple(input.emailId)
			if (!email) throw new Error('Email not found')

			const purchasers = await getEventPurchasers(input.eventId)

			if (purchasers.length === 0) {
				return { sent: 0, errors: [] }
			}

			const liquid = new Liquid()
			const emailBody =
				email.fields?.body || 'Reminder: Your event is starting soon!'
			const emailSubject =
				email.fields?.subject || `Reminder: ${event.fields.title}`

			let sentCount = 0
			const errors: string[] = []

			for (const purchaser of purchasers) {
				try {
					const parsedBody = await liquid.parseAndRender(emailBody, {
						event,
						title: event.fields.title,
						url: `${env.NEXT_PUBLIC_URL}/events/${event.fields.slug}`,
						user: purchaser,
					})
					const parsedSubject = await liquid.parseAndRender(
						emailSubject,
						{
							event,
							title: event.fields.title,
							user: purchaser,
						},
					)

					await sendAnEmail({
						Component: BasicEmail,
						componentProps: { body: parsedBody },
						Subject: parsedSubject,
						To: purchaser.email,
						From: `${env.NEXT_PUBLIC_SITE_TITLE} <${env.NEXT_PUBLIC_SUPPORT_EMAIL}>`,
						type: 'transactional',
					})
					sentCount++
				} catch (err) {
					errors.push(
						`Failed to send to ${purchaser.email}: ${err instanceof Error ? err.message : String(err)}`,
					)
				}
			}

			return { sent: sentCount, errors }
		}),
})
