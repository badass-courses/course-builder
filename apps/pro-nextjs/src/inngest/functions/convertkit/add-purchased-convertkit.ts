import { emailListProvider } from '@/coursebuilder/email-list-provider'
import { db } from '@/db'
import { purchases, users } from '@/db/schema'
import { inngest } from '@/inngest/inngest.server'
import { format } from 'date-fns'
import { eq } from 'drizzle-orm'

import { NEW_PURCHASE_CREATED_EVENT } from '@coursebuilder/core/inngest/commerce/event-new-purchase-created'

export const addPurchasesConvertkit = inngest.createFunction(
	{
		id: `add-purchase-role-discord`,
		name: 'Add Purchase Role Discord',
		idempotency: 'event.user.email',
	},
	{ event: NEW_PURCHASE_CREATED_EVENT },
	async ({ event, step }) => {
		const user = await step.run('get user', async () => {
			return db.query.users.findFirst({
				where: eq(users.id, event.user.id),
				with: {
					accounts: true,
					purchases: true,
				},
			})
		})

		if (!user) throw new Error('No user found')

		const purchase = await step.run('get purchase', async () => {
			return db.query.purchases.findFirst({
				where: eq(purchases.id, event.data.purchaseId),
			})
		})

		if (!purchase) throw new Error('No purchase found')

		const convertkitUser = await step.run('get convertkit user', async () => {
			console.log('get ck user', { user })
			return emailListProvider.getSubscriberByEmail(user.email)
		})

		if (convertkitUser && emailListProvider.updateSubscriberFields) {
			await step.run('update convertkit user', async () => {
				return emailListProvider.updateSubscriberFields?.({
					subscriberId: convertkitUser.id,
					fields: {
						purchased_pronextjs_course_on: format(
							new Date(purchase.createdAt),
							'yyyy-MM-dd HH:mm:ss z',
						),
					},
				})
			})
			console.log(`synced convertkit tags for ${purchase.id}`)
		} else {
			console.log(`no convertkit tags to sync for ${user.email}`)
		}

		return 'No discord account found for user'
	},
)
