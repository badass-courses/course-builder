import { db } from '@/db'
import { products, purchases } from '@/db/schema'
import { NewEmailSchema } from '@/lib/emails'
import { getEmail, updateEmail } from '@/lib/emails-query'
import {
	attachReminderEmailToEvent,
	createAndAttachReminderEmailToEvent,
	detachReminderEmailFromEvent,
	getActiveEvents,
	getAllReminderEmails,
	getEventReminderEmail,
	getEventReminderEmails,
	updateReminderEmailHours,
} from '@/lib/events-query'
import { getServerAuthSession } from '@/server/auth'
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from '@/trpc/api/trpc'
import { count, desc, eq } from 'drizzle-orm'
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
	getActiveEvents: publicProcedure.query(async () => {
		return await getActiveEvents()
	}),
	attachReminderEmailToEvent: protectedProcedure
		.input(
			z.object({
				eventId: z.string(),
				emailId: z.string(),
				hoursInAdvance: z.number().optional().default(24),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await attachReminderEmailToEvent(
				input.eventId,
				input.emailId,
				input.hoursInAdvance,
			)
		}),
	detachReminderEmailFromEvent: protectedProcedure
		.input(
			z.object({
				eventId: z.string(),
				emailId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await detachReminderEmailFromEvent(input.eventId, input.emailId)
		}),
	getEventReminderEmail: protectedProcedure
		.input(
			z.object({
				eventId: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			return await getEventReminderEmail(input.eventId)
		}),
	getEventReminderEmails: publicProcedure
		.input(
			z.object({
				eventId: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			return await getEventReminderEmails(input.eventId)
		}),
	getAllReminderEmails: publicProcedure.query(async () => {
		return await getAllReminderEmails()
	}),
	createAndAttachReminderEmailToEvent: protectedProcedure
		.input(
			z.object({
				eventId: z.string(),
				input: NewEmailSchema,
				hoursInAdvance: z.number().optional().default(24),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await createAndAttachReminderEmailToEvent(
				input.eventId,
				input.input,
				input.hoursInAdvance,
			)
		}),
	updateReminderEmailHours: protectedProcedure
		.input(
			z.object({
				eventId: z.string(),
				emailId: z.string(),
				hoursInAdvance: z.number().min(1).max(168),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await updateReminderEmailHours(
				input.eventId,
				input.emailId,
				input.hoursInAdvance,
			)
		}),
	updateReminderEmail: protectedProcedure
		.input(
			z.object({
				emailId: z.string(),
				eventId: z.string(),
				hoursInAdvance: z.number().min(1).max(168),
				fields: NewEmailSchema.shape.fields,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const email = await getEmail(input.emailId)

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

			return await updateEmail({
				...email,
				id: input.emailId,
				fields: {
					...email.fields,
					...input.fields,
				},
			})
		}),
})
