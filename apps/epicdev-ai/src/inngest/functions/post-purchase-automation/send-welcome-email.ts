import { courseBuilderAdapter, db } from '@/db'
import {
	contentResourceProduct,
	coupon,
	products,
	purchases,
	users,
} from '@/db/schema'
import WelcomeEmail, { WelcomeEmailForTeam } from '@/emails/welcome-email'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { getEventOrEventSeries } from '@/lib/events-query'
import { sendAnEmail } from '@/utils/send-an-email'
import { type AuthConfig } from '@auth/core'
import { addDays, format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { eq } from 'drizzle-orm'
import { NonRetriableError } from 'inngest'

import { NEW_PURCHASE_CREATED_EVENT } from '@coursebuilder/core/inngest/commerce/event-new-purchase-created'

const siteRootUrl = env.NEXT_PUBLIC_URL

export const sendWelcomeEmail = inngest.createFunction(
	{
		id: 'send-welcome-email',
		name: 'Post-Purchase - Send Welcome Email',
		idempotency: 'event.data.checkoutSessionId',
	},
	{
		event: NEW_PURCHASE_CREATED_EVENT,
	},
	async ({ event, step }) => {
		const purchase = await step.run('Load Purchase', async () => {
			return db.query.purchases.findFirst({
				where: eq(purchases.id, event.data.purchaseId),
			})
		})

		if (!purchase || !purchase.userId) {
			throw new NonRetriableError('Purchase not found')
		}

		const isTeamPurchaseByCoupon = Boolean(purchase.bulkCouponId)
		let quantity = 1 // Default to 1 seat

		if (isTeamPurchaseByCoupon && purchase.bulkCouponId) {
			const bulkCoupon = await step.run('Load Bulk Coupon', async () => {
				return db.query.coupon.findFirst({
					where: eq(coupon.id, purchase.bulkCouponId as string),
				})
			})

			if (bulkCoupon && typeof bulkCoupon.maxUses === 'number') {
				quantity = bulkCoupon.maxUses
			} else {
				// Fallback or error if coupon not found or maxUses is not a number
				// For now, defaults to 1, but you might want to log this
				console.warn(
					`Bulk coupon ${purchase.bulkCouponId} not found or maxUses missing. Defaulting to 1 seat.`,
				)
				// Consider if this should be a NonRetriableError if a bulk coupon was expected
				// but not found, or if maxUses is critical.
			}
		} else {
			// If not a team purchase by coupon, check if quantity is in event.data
			// This part depends on the structure of NEW_PURCHASE_CREATED_EVENT
			// For example, if event.data.quantity exists:
			// if (typeof event.data.quantity === 'number' && event.data.quantity > 0) {
			//   actualQuantity = event.data.quantity;
			// }
			// For now, we are only handling the bulkCouponId case for quantity > 1
		}

		const product = await step.run('Load Product', async () => {
			return await db.query.products.findFirst({
				where: eq(products.id, purchase.productId),
			})
		})

		if (!product) {
			throw new NonRetriableError('Product not found')
		}

		if (product.type !== 'live') {
			return {
				skipped: true,
				reason: 'Product is not an event',
			}
		}

		const user = await step.run('Load User', async () => {
			if (!purchase.userId) {
				throw new NonRetriableError('No user id for purchase.')
			}
			return await db.query.users.findFirst({
				where: eq(users.id, purchase.userId),
				columns: {
					email: true,
					name: true,
				},
			})
		})

		if (!user) {
			throw new NonRetriableError('User not found')
		}

		const userFirstName = user.name?.split(' ')[0]

		const eventResource = await step.run('Load Event', async () => {
			const productRef = await db.query.contentResourceProduct.findFirst({
				where: eq(contentResourceProduct.productId, product.id),
			})

			if (!productRef) {
				throw new NonRetriableError('Content Resource Product not found')
			}

			return await getEventOrEventSeries(productRef.resourceId)
		})

		if (!eventResource) {
			throw new NonRetriableError('Event not found')
		}

		// For event-series, get dates from first child event; for single events, use event fields
		const eventFields =
			eventResource.type === 'event'
				? eventResource.fields
				: eventResource?.resources?.[0]?.resource?.fields

		// Validate that we have event fields
		if (!eventFields) {
			return {
				skipped: true,
				reason:
					eventResource.type === 'event-series'
						? 'Event series has no child events'
						: 'No event fields available',
			}
		}

		if (!eventFields?.startsAt || !eventFields?.endsAt) {
			return { skipped: true, reason: 'No event dates available' }
		}

		const { startsAt: _startsAt, endsAt: _endsAt, title } = eventFields

		// Convert to Date objects for formatting
		const startsAtDate = new Date(_startsAt)
		const endsAtDate = new Date(_endsAt)

		// Format dates and times in Pacific Time (Los Angeles timezone)
		const PT = 'America/Los_Angeles'
		const startDate = formatInTimeZone(startsAtDate, PT, 'MMMM do, yyyy')
		const endDate = formatInTimeZone(endsAtDate, PT, 'MMMM do, yyyy')
		const startTime = formatInTimeZone(startsAtDate, PT, 'h:mm a')
		const endTime = formatInTimeZone(endsAtDate, PT, 'h:mm a')

		function pickEmail() {
			switch (true) {
				case isTeamPurchaseByCoupon:
					return WelcomeEmailForTeam
				default:
					return WelcomeEmail
			}
		}

		return await step.run('send welcome email', async () => {
			return await sendAnEmail({
				Component: pickEmail(),
				componentProps: {
					productName: title || product.name,
					startDate: startDate,
					startTime: startTime,
					endTime: endTime,
					userFirstName: userFirstName,
					supportEmail: env.NEXT_PUBLIC_SUPPORT_EMAIL,
					quantity: quantity,
				},
				Subject: `You're in! Get Ready for ${product.name}! 🎉`,
				To: user.email,
				ReplyTo: env.NEXT_PUBLIC_SUPPORT_EMAIL,
				From: env.NEXT_PUBLIC_SUPPORT_EMAIL,
				type: 'transactional',
			})
		})
	},
)
