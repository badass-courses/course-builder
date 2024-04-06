import { type Adapter } from '@auth/core/adapters'

import { UpgradableProduct } from './schemas'
import { Coupon } from './schemas/coupon-schema'
import { MerchantCoupon } from './schemas/merchant-coupon-schema'
import { MerchantCustomer } from './schemas/merchant-customer-schema'
import { MerchantProduct } from './schemas/merchant-product-schema'
import { Price } from './schemas/price-schema'
import { Product } from './schemas/product-schema'
import { Purchase } from './schemas/purchase-schema'
import {
	PurchaseUserTransfer,
	PurchaseUserTransferState,
} from './schemas/purchase-user-transfer-schema'
import { ResourceProgress } from './schemas/resource-progress-schema'
import { User } from './schemas/user-schema'
import { VideoResource } from './schemas/video-resource'
import {
	ContentResourceResource,
	type Awaitable,
	type ContentResource,
} from './types'

export interface CourseBuilderAdapter<
	TDatabaseInstance extends abstract new (...args: any) => any = any,
> extends Adapter,
		SkillProductsCommerceSdk {
	client: InstanceType<TDatabaseInstance>
	createPurchase(options: {
		id?: string
		userId: string
		productId: string
		merchantChargeId: string
		merchantSessionId: string
		totalAmount: string
		status?: string
		metadata?: Record<string, any>
	}): Promise<Purchase>
	addResourceToResource(options: {
		childResourceId: string
		parentResourceId: string
	}): Awaitable<ContentResourceResource | null>
	createContentResource(resource: {
		id: string
		type: string
		fields: Record<string, any>
		createdById: string
	}): Awaitable<ContentResource>
	getContentResource(id: string): Awaitable<ContentResource | null>
	getVideoResource(id: string | null | undefined): Promise<VideoResource | null>
	updateContentResourceFields(options: {
		id: string
		fields: Record<string, any>
	}): Awaitable<ContentResource | null>
}

export const MockCourseBuilderAdapter: CourseBuilderAdapter = {
	client: null,
	createPurchase: async (options) => {
		throw new Error('Method not implemented.')
	},
	availableUpgradesForProduct(
		purchases: any,
		productId: string,
	): Promise<
		{
			upgradableTo: { id: string; name: string }
			upgradableFrom: { id: string; name: string }
		}[]
	> {
		return Promise.resolve([])
	},
	clearLessonProgressForUser(options: {
		userId: string
		lessons: { id: string; slug: string }[]
	}): Promise<void> {
		return Promise.resolve(undefined)
	},
	completeLessonProgressForUser(options: {
		userId: string
		lessonId?: string
	}): Promise<ResourceProgress | null> {
		return Promise.resolve(null)
	},
	couponForIdOrCode(options: {
		code?: string
		couponId?: string
	}): Promise<(Coupon & { merchantCoupon: MerchantCoupon }) | null> {
		return Promise.resolve(null)
	},
	createMerchantChargeAndPurchase(options: {
		userId: string
		productId: string
		stripeChargeId: string
		stripeCouponId?: string
		merchantAccountId: string
		merchantProductId: string
		merchantCustomerId: string
		stripeChargeAmount: number
		quantity?: number
		bulk?: boolean
		checkoutSessionId: string
		appliedPPPStripeCouponId?: string
		upgradedFromPurchaseId?: string
		usedCouponId?: string
		country?: string
	}): Promise<Purchase> {
		throw new Error('Method not implemented.')
	},
	findOrCreateMerchantCustomer(options: {
		user: User
		identifier: string
		merchantAccountId: string
	}): Promise<MerchantCustomer | null> {
		return Promise.resolve(null)
	},
	findOrCreateUser(
		email: string,
		name?: string | null,
	): Promise<{
		user: User
		isNewUser: boolean
	}> {
		throw new Error('Method not implemented.')
	},
	getCoupon(couponIdOrCode: string): Promise<Coupon | null> {
		return Promise.resolve(null)
	},
	getCouponWithBulkPurchases(couponId: string): Promise<
		| (Coupon & {
				bulkCouponPurchases: { bulkCouponId: string }[]
		  })
		| null
	> {
		return Promise.resolve(null)
	},
	getDefaultCoupon(productIds?: string[]): Promise<{
		defaultMerchantCoupon: MerchantCoupon
		defaultCoupon: Coupon
	} | null> {
		return Promise.resolve(null)
	},
	getLessonProgressCountsByDate(): Promise<
		{
			count: number
			completedAt: string
		}[]
	> {
		return Promise.resolve([])
	},
	getLessonProgressForUser(userId: string): Promise<ResourceProgress[]> {
		return Promise.resolve([])
	},
	getLessonProgresses(): Promise<ResourceProgress[]> {
		return Promise.resolve([])
	},
	getMerchantCharge(merchantChargeId: string): Promise<{
		id: string
		identifier: string
		merchantProductId: string
	} | null> {
		return Promise.resolve(null)
	},
	getMerchantCoupon(merchantCouponId: string): Promise<MerchantCoupon | null> {
		return Promise.resolve(null)
	},
	getMerchantProduct(stripeProductId: string): Promise<MerchantProduct | null> {
		return Promise.resolve(null)
	},
	getPrice(productId: string): Promise<Price | null> {
		return Promise.resolve(null)
	},
	getProduct(productId: string): Promise<Product | null> {
		return Promise.resolve(null)
	},
	getPurchase(purchaseId: string): Promise<Purchase | null> {
		return Promise.resolve(null)
	},
	getPurchaseDetails(
		purchaseId: string,
		userId: string,
	): Promise<{
		purchase?: Purchase
		existingPurchase?: Purchase
		availableUpgrades: UpgradableProduct[]
	}> {
		return Promise.resolve({ availableUpgrades: [] })
	},
	getPurchaseForStripeCharge(stripeChargeId: string): Promise<Purchase | null> {
		return Promise.resolve(null)
	},
	getPurchaseUserTransferById(options: { id: string }): Promise<
		| (PurchaseUserTransfer & {
				sourceUser: User
				targetUser: User | null
				purchase: Purchase
		  })
		| null
	> {
		return Promise.resolve(null)
	},
	getPurchaseWithUser(purchaseId: string): Promise<
		| (Purchase & {
				user: User
		  })
		| null
	> {
		return Promise.resolve(null)
	},
	getPurchasesForUser(userId?: string): Promise<Purchase[]> {
		return Promise.resolve([])
	},
	getUserById(userId: string): Promise<User | null> {
		return Promise.resolve(null)
	},
	pricesOfPurchasesTowardOneBundle(options: {
		userId: string | undefined
		bundleId: string
	}): Promise<Price[]> {
		return Promise.resolve([])
	},
	toggleLessonProgressForUser(options: {
		userId: string
		lessonId?: string
		lessonSlug?: string
	}): Promise<ResourceProgress | null> {
		return Promise.resolve(null)
	},
	transferPurchasesToNewUser(options: {
		merchantCustomerId: string
		userId: string
	}): Promise<unknown> {
		return Promise.resolve(undefined)
	},
	updatePurchaseStatusForCharge(
		chargeId: string,
		status: 'Valid' | 'Refunded' | 'Disputed' | 'Banned' | 'Restricted',
	): Promise<Purchase | undefined> {
		return Promise.resolve(undefined)
	},
	updatePurchaseUserTransferTransferState(options: {
		id: string
		transferState: PurchaseUserTransferState
	}): Promise<PurchaseUserTransfer | null> {
		return Promise.resolve(null)
	},
	addResourceToResource: async (options) => {
		return {} as ContentResourceResource
	},
	createContentResource: async (resource) => {
		return resource as ContentResource
	},
	getContentResource: async (_) => {
		return null
	},
	getVideoResource: async (_) => {
		return null
	},
	updateContentResourceFields(_) {
		return null
	},
}

interface SkillProductsCommerceSdk {
	getPurchaseDetails(
		purchaseId: string,
		userId: string,
	): Promise<{
		purchase?: Purchase
		existingPurchase?: Purchase
		availableUpgrades: UpgradableProduct[]
	}>
	getPurchaseForStripeCharge(stripeChargeId: string): Promise<Purchase | null>
	updatePurchaseStatusForCharge(
		chargeId: string,
		status: 'Valid' | 'Refunded' | 'Disputed' | 'Banned' | 'Restricted',
	): Promise<Purchase | undefined>
	couponForIdOrCode(options: {
		code?: string
		couponId?: string
	}): Promise<(Coupon & { merchantCoupon: MerchantCoupon }) | null>
	availableUpgradesForProduct(
		purchases: any,
		productId: string,
	): Promise<
		{
			upgradableTo: {
				id: string
				name: string
			}
			upgradableFrom: {
				id: string
				name: string
			}
		}[]
	>
	completeLessonProgressForUser(options: {
		userId: string
		lessonId?: string
	}): Promise<ResourceProgress | null>
	clearLessonProgressForUser(options: {
		userId: string
		lessons: { id: string; slug: string }[]
	}): Promise<void>
	toggleLessonProgressForUser(options: {
		userId: string
		lessonId?: string
		lessonSlug?: string
	}): Promise<ResourceProgress | null>
	getLessonProgressForUser(userId: string): Promise<ResourceProgress[] | null>
	getLessonProgresses(): Promise<ResourceProgress[]>
	getLessonProgressCountsByDate(): Promise<
		{
			count: number
			completedAt: string
		}[]
	>
	getPurchaseWithUser(
		purchaseId: string,
	): Promise<(Purchase & { user: User }) | null>
	getCouponWithBulkPurchases(
		couponId: string,
	): Promise<
		(Coupon & { bulkCouponPurchases: { bulkCouponId: string }[] }) | null
	>
	getPurchase(purchaseId: string): Promise<Purchase | null>
	getPurchasesForUser(userId?: string): Promise<Purchase[]>
	getMerchantProduct(stripeProductId: string): Promise<MerchantProduct | null>
	getMerchantCharge(merchantChargeId: string): Promise<{
		id: string
		identifier: string
		merchantProductId: string
	} | null>
	createMerchantChargeAndPurchase(options: {
		userId: string
		productId: string
		stripeChargeId: string
		stripeCouponId?: string
		merchantAccountId: string
		merchantProductId: string
		merchantCustomerId: string
		stripeChargeAmount: number
		quantity?: number
		bulk?: boolean
		checkoutSessionId: string
		appliedPPPStripeCouponId: string | undefined
		upgradedFromPurchaseId: string | undefined
		usedCouponId: string | undefined
		country?: string
	}): Promise<Purchase>
	findOrCreateMerchantCustomer(options: {
		user: User
		identifier: string
		merchantAccountId: string
	}): Promise<MerchantCustomer | null>
	findOrCreateUser(
		email: string,
		name?: string | null,
	): Promise<{ user: User; isNewUser: boolean }>
	getUserById(userId: string): Promise<User | null>
	getProduct(productId: string): Promise<Product | null>
	getPrice(productId: string): Promise<Price | null>
	getMerchantCoupon(merchantCouponId: string): Promise<MerchantCoupon | null>
	getCoupon(couponIdOrCode: string): Promise<Coupon | null>
	getDefaultCoupon(productIds?: string[]): Promise<{
		defaultMerchantCoupon: MerchantCoupon
		defaultCoupon: Coupon
	} | null>
	transferPurchasesToNewUser(options: {
		merchantCustomerId: string
		userId: string
	}): Promise<unknown>
	getPurchaseUserTransferById(options: { id: string }): Promise<
		| (PurchaseUserTransfer & {
				sourceUser: User
				targetUser: User | null
				purchase: Purchase
		  })
		| null
	>
	updatePurchaseUserTransferTransferState(options: {
		id: string
		transferState: PurchaseUserTransferState
	}): Promise<PurchaseUserTransfer | null>
	pricesOfPurchasesTowardOneBundle(options: {
		userId: string | undefined
		bundleId: string
	}): Promise<Price[]>
}
