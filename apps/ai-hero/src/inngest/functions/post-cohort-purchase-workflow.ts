import BasicEmail from '@/emails/basic-email'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { sendAnEmail } from '@/utils/send-an-email'
import { Liquid } from 'liquidjs'

import { NEW_PURCHASE_CREATED_EVENT } from '@coursebuilder/core/inngest/commerce/event-new-purchase-created'

export const postCohortPurchaseWorkflow = inngest.createFunction(
	{
		id: `post-cohort-purchase-workflow`,
		name: `PostCohort Purchase Followup Workflow`,
	},
	{
		event: NEW_PURCHASE_CREATED_EVENT,
		if: 'event.data.productType == "cohort"',
	},
	async ({ event, step, db }) => {
		const purchase = await step.run(`get purchase`, async () => {
			return db.getPurchase(event.data.purchaseId)
		})

		if (!purchase) {
			throw new Error(`purchase not found`)
		}

		const product = await step.run(`get product`, async () => {
			return db.getProduct(purchase.productId as string)
		})

		if (!product) {
			throw new Error(`product not found`)
		}

		const user = await step.run(`get user`, async () => {
			return db.getUserById(purchase.userId as string)
		})

		if (!user) {
			throw new Error(`user not found`)
		}

		// determine if this is a bulk purchase or an individual purchase
		// if individual, assign entitlements to the user
		// how do we look up entitlements?
	},
)
