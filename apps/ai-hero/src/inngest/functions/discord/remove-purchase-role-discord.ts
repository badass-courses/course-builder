import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { getDiscordAccount } from '@/lib/discord-query'
import { removeDiscordRole } from '@/lib/discord-utils'

import { PURCHASE_STATUS_UPDATED_EVENT } from '@coursebuilder/core/inngest/commerce/event-purchase-status-updated'

export const removePurchaseRoleDiscord = inngest.createFunction(
	{ id: `remove-purchase-role-discord`, name: 'Remove Purchase Role Discord' },
	{
		event: PURCHASE_STATUS_UPDATED_EVENT,
		if: 'event.data.status == "Refunded" || event.data.status == "Disputed" || event.data.status == "Banned"',
	},
	async ({ event, step, db: adapter }) => {
		const purchase = await step.run('get purchase', async () => {
			return adapter.getPurchaseForStripeCharge(event.data.stripeChargeId)
		})

		if (!purchase || !purchase.userId) {
			throw new Error('No purchase found')
		}

		const user = await step.run('get user', async () => {
			return adapter.getUserById(purchase.userId as string)
		})

		if (!user) {
			throw new Error('No user found')
		}

		// Remove the Discord cohort role using the utility function
		if (!env.DISCORD_COHORT_001_ROLE_ID) {
			return {
				status: 'error',
				reason: 'Discord cohort role ID not configured',
				userId: user.id,
				purchaseId: purchase.id,
			}
		}

		const result = await removeDiscordRole(
			user.id,
			env.DISCORD_COHORT_001_ROLE_ID,
		)

		return {
			...result,
			userId: user.id,
			purchaseId: purchase.id,
		}
	},
)
