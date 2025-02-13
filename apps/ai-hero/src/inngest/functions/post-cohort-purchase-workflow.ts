import { db } from '@/db'
import { organizationMemberships } from '@/db/schema'
import BasicEmail from '@/emails/basic-email'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { CohortSchema } from '@/lib/cohort'
import { getCohort } from '@/lib/cohorts-query'
import { sendAnEmail } from '@/utils/send-an-email'
import { and, eq } from 'drizzle-orm'
import { Liquid } from 'liquidjs'

import { NEW_PURCHASE_CREATED_EVENT } from '@coursebuilder/core/inngest/commerce/event-new-purchase-created'

export const postCohortPurchaseWorkflow = inngest.createFunction(
	{
		id: `post-cohort-purchase-workflow`,
		name: `Post Cohort Purchase Followup Workflow`,
	},
	{
		event: NEW_PURCHASE_CREATED_EVENT,
		if: 'event.data.productType == "cohort"',
	},
	async ({ event, step, db: adapter }) => {
		const purchase = await step.run(`get purchase`, async () => {
			return adapter.getPurchase(event.data.purchaseId)
		})

		if (!purchase) {
			throw new Error(`purchase not found`)
		}

		const product = await step.run(`get product`, async () => {
			return adapter.getProduct(purchase.productId as string)
		})

		if (!product) {
			throw new Error(`product not found`)
		}

		const user = await step.run(`get user`, async () => {
			return adapter.getUserById(purchase.userId as string)
		})

		if (!user) {
			throw new Error(`user not found`)
		}

		const isTeamPurchase = Boolean(purchase.bulkCouponId)

		// the cohort should be part of the product resources
		const cohortResourceId = product.resources?.find(
			(resource) => resource.resource?.type === 'cohort',
		)?.resource.id

		const cohortResource = await step.run(`get cohort resource`, async () => {
			return getCohort(cohortResourceId)
		})

		if (isTeamPurchase) {
			// send an email to the purchaser explaining next steps
		} else {
			if (['Valid', 'Restricted'].includes(purchase.status)) {
				// send an email to the purchaser explaining next steps
				const orgMembership = await step.run(`get org membership`, async () => {
					return await db.query.organizationMemberships.findFirst({
						where: and(eq(organizationMemberships.userId, user.id)),
					})
				})
			} else {
				// send a slack message or something because it seems broken
			}
		}

		return {
			purchase,
			product,
			user,
			cohortResource,
			isTeamPurchase,
		}
	},
)
