import { z } from 'zod'

import {
	CoreInngestFunctionInput,
	CoreInngestHandler,
	CoreInngestTrigger,
} from '../create-inngest-middleware'

export const PURCHASE_STATUS_UPDATED_EVENT = 'commerce/update-purchase-status'

export type PurchaseStatusUpdated = {
	name: typeof PURCHASE_STATUS_UPDATED_EVENT
	data: PurchaseStatusUpdatedEvent
}

export type PurchaseStatusUpdatedEvent = z.infer<
	typeof PurchaseStatusUpdatedEventSchema
>

export const PurchaseStatusUpdatedEventSchema = z.object({
	stripeChargeId: z.string(),
	status: z.enum(['Valid', 'Refunded', 'Disputed', 'Banned', 'Restricted']),
})

export const updatePurchaseStatusConfig = {
	id: `update-purchase-status`,
	name: 'Update Purchase Status',
}
export const updatePurchaseStatusTrigger: CoreInngestTrigger = {
	event: PURCHASE_STATUS_UPDATED_EVENT,
}

export const updatePurchaseStatusHandler: CoreInngestHandler = async ({
	event,
	step,
	db,
	notificationProvider,
	paymentProvider,
}: CoreInngestFunctionInput) => {
	return await step.run('update purchase status', async () => {
		return db.updatePurchaseStatusForCharge(
			event.data.stripeChargeId,
			event.data.status,
		)
	})
}

export const updatePurchaseStatus = {
	config: updatePurchaseStatusConfig,
	trigger: updatePurchaseStatusTrigger,
	handler: updatePurchaseStatusHandler,
}
