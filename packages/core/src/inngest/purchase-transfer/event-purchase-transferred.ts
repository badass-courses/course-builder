export const PURCHASE_TRANSFERRED_EVENT = 'commerce/purchase_transferred'

export type PurchaseTransferred = {
	name: typeof PURCHASE_TRANSFERRED_EVENT
	data: {
		purchaseId: string
		sourceUserId: string
		targetUserId: string
	}
}
