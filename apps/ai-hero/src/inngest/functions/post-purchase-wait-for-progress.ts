import { LESSON_COMPLETED_EVENT } from '@/inngest/events/lesson-completed'
import { NO_PROGRESS_MADE_EVENT } from '@/inngest/events/no-progress-made-event'
import { inngest } from '@/inngest/inngest.server'

import { NEW_PURCHASE_CREATED_EVENT } from '@coursebuilder/core/inngest/commerce/event-new-purchase-created'

export const postPurchaseWaitForProgress = inngest.createFunction(
	{
		id: `post-purchase-wait-for-progress`,
		name: `Post-Purchase: Wait for Progress`,
	},
	{
		event: NEW_PURCHASE_CREATED_EVENT,
	},
	async ({ event, step, db }) => {
		const purchase = await step.run(`get purchase`, async () => {
			return db.getPurchase(event.data.purchaseId)
		})

		if (!purchase) {
			throw new Error(`purchase not found`)
		}

		const user = await step.run(`get user`, async () => {
			return db.getUserById(purchase.userId as string)
		})

		if (!user) {
			throw new Error(`user not found`)
		}

		const progressEvent = await step.waitForEvent(`wait for any progress`, {
			event: LESSON_COMPLETED_EVENT,
			timeout: '1d',
		})

		if (!progressEvent) {
			return await step.sendEvent(`send no progress event`, {
				name: NO_PROGRESS_MADE_EVENT,
				data: {
					messageCount: 0,
					type: 'post-purchase',
				},
				user,
			})
		}
	},
)
