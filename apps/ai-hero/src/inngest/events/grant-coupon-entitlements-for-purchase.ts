export const GRANT_COUPON_ENTITLEMENTS_FOR_PURCHASE_EVENT =
	'coupon/grant-entitlements-for-purchase'

export type GrantCouponEntitlementsForPurchase = {
	name: typeof GRANT_COUPON_ENTITLEMENTS_FOR_PURCHASE_EVENT
	data: {
		purchaseId: string
		userId: string
		productId: string
		purchaseStatus: string
		totalAmount: string | number
		bulkCouponId?: string | null
	}
}
