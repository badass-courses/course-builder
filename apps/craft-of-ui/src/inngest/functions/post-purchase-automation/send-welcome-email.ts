import { courseBuilderAdapter, db } from '@/db'
import { products, purchases, users } from '@/db/schema'
import WelcomeEmail from '@/emails/welcome-email'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { sendAnEmail } from '@/utils/send-an-email'
import { type AuthConfig } from '@auth/core'
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

		const product = await step.run('Load Product', async () => {
			return db.query.products.findFirst({
				where: eq(products.id, purchase.productId),
			})
		})

		if (!product) {
			throw new NonRetriableError('Product not found')
		}

		if (product.id !== 'product-bxkqx') {
			return {
				skipped: true,
				reason: 'Product is not product-bxkqx',
			}
		}

		const user = await step.run('Load User', async () => {
			if (!purchase.userId) {
				throw new NonRetriableError('No user id for purchase.')
			}
			return db.query.users.findFirst({
				where: eq(users.id, purchase.userId),
			})
		})

		if (!user) {
			throw new NonRetriableError('User not found')
		}

		return await step.run('send welcome email', async () => {
			return await sendAnEmail({
				Component: WelcomeEmail,
				componentProps: {
					productName: product.name,
				},
				Subject: `Welcome to ${product.name} 🎉`,
				To: user.email,
				ReplyTo: env.NEXT_PUBLIC_SUPPORT_EMAIL,
				From: env.NEXT_PUBLIC_SUPPORT_EMAIL,
				type: 'transactional',
			})
		})
	},
)
