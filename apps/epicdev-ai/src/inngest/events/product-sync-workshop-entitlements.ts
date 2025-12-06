/**
 * Event triggered to sync workshop entitlements for all purchases of a specific product.
 * Finds all purchases for the productId and ensures each person has all 5 required workshop entitlements.
 */
export const PRODUCT_SYNC_WORKSHOP_ENTITLEMENTS_EVENT =
	'product/sync-workshop-entitlements' as const

export type ProductSyncWorkshopEntitlements = {
	name: typeof PRODUCT_SYNC_WORKSHOP_ENTITLEMENTS_EVENT
	data: {
		productId: string
	}
}
