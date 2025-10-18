import { NonRetriableError } from 'inngest'
import pluralize from 'pluralize'

import { isEmpty } from '@coursebuilder/nodash'

import {
	CoreInngestFunctionInput,
	CoreInngestHandler,
	CoreInngestTrigger,
} from '../create-inngest-middleware'
import { NEW_PURCHASE_CREATED_EVENT } from './event-new-purchase-created'

export const sendCreatorSlackNotificationConfig = {
	id: `send-post-purchase-slack`,
	name: 'Send Post Purchase Slack',
	idempotency: 'event.data.checkoutSessionId',
}
export const sendCreatorSlackNotificationTrigger: CoreInngestTrigger = {
	event: NEW_PURCHASE_CREATED_EVENT,
}
export const sendCreatorSlackNotificationHandler: CoreInngestHandler = async ({
	event,
	step,
	db,
	notificationProvider,
	paymentProvider,
}: CoreInngestFunctionInput) => {
	if (!notificationProvider) {
		console.log('no notification provider')
		return { error: 'no notification provider' }
	}

	const purchase = await step.run('load the new purchase', async () => {
		return db.getPurchase(event.data.purchaseId)
	})

	if (!purchase) throw new NonRetriableError('No new purchase found')

	const purchaseInfo = await step.run(
		'load the new purchase info',
		async () => {
			return paymentProvider.getPurchaseInfo(event.data.checkoutSessionId, db)
		},
	)

	if (!purchaseInfo) throw new NonRetriableError('No new purchase info found')

	return await step.run('send slack notification', async () => {
		await notificationProvider.sendNotification({
			channel: notificationProvider.defaultChannelId,
			text:
				process.env.NODE_ENV === 'production'
					? `Someone purchased ${purchaseInfo.product.name}`
					: `Someone purchased ${purchaseInfo.product.name} in ${process.env.NODE_ENV}`,
			attachments: [
				{
					fallback: `Sold (${purchaseInfo.quantity}) ${purchaseInfo.product.name}`,
					text: `Somebody (${purchaseInfo.email}) bought ${
						purchaseInfo.quantity
					} ${pluralize('copy', purchaseInfo.quantity)} of ${
						purchaseInfo.product.name
					} for ${`$${purchase.totalAmount}`}${
						isEmpty(purchase.upgradedFromId) ? '' : ' as an upgrade'
					}`,
					color: process.env.NODE_ENV === 'production' ? '#eba234' : '#5ceb34',
					title: `Sold (${purchaseInfo.quantity}) ${purchaseInfo.product.name}`,
				},
			],
		})
	})
}

export const sendCreatorSlackNotification = {
	config: sendCreatorSlackNotificationConfig,
	trigger: sendCreatorSlackNotificationTrigger,
	handler: sendCreatorSlackNotificationHandler,
}
