import { type Adapter } from '@auth/core/adapters'

import {
	ContentResourceResource,
	MerchantCharge,
	NewProduct,
	UpgradableProduct,
} from './schemas'
import {
	type ContentResource,
	type ContentResourceProduct,
} from './schemas/content-resource-schema'
import { Coupon } from './schemas/coupon-schema'
import { MerchantAccount } from './schemas/merchant-account-schema'
import { MerchantCoupon } from './schemas/merchant-coupon-schema'
import { MerchantCustomer } from './schemas/merchant-customer-schema'
import { MerchantEvents } from './schemas/merchant-events-schema'
import { MerchantPrice } from './schemas/merchant-price-schema'
import { MerchantProduct } from './schemas/merchant-product-schema'
import { MerchantSession } from './schemas/merchant-session'
import { MerchantSubscription } from './schemas/merchant-subscription'
import { OrganizationMember } from './schemas/organization-member'
import { Organization } from './schemas/organization-schema'
import { Price } from './schemas/price-schema'
import { Product } from './schemas/product-schema'
import { Purchase } from './schemas/purchase-schema'
import {
	PurchaseUserTransfer,
	PurchaseUserTransferState,
} from './schemas/purchase-user-transfer-schema'
import {
	ModuleProgress,
	ResourceProgress,
} from './schemas/resource-progress-schema'
import { Subscription } from './schemas/subscription'
import { User } from './schemas/user-schema'
import { VideoResource } from './schemas/video-resource'
import { type Awaitable } from './types'

export interface CourseBuilderAdapter<
	TDatabaseInstance extends abstract new (...args: any) => any = any,
> extends Adapter,
		SkillProductsCommerceSdk {
	client: InstanceType<TDatabaseInstance>
	archiveProduct(productId: string): Promise<Product | null>
	createProduct(product: NewProduct): Promise<Product | null>
	updateProduct(product: Product): Promise<Product | null>
	createPurchase(options: {
		id?: string
		userId: string
		productId: string
		merchantChargeId?: string
		merchantSessionId?: string
		totalAmount: string
		couponId?: string | null
		redeemedBulkCouponId?: string | null
		status?: string
		metadata?: Record<string, any>
		organizationId?: string
	}): Promise<Purchase>
	addResourceToResource(options: {
		childResourceId: string
		parentResourceId: string
	}): Awaitable<ContentResourceResource | null>
	removeResourceFromResource(options: {
		childResourceId: string
		parentResourceId: string
	}): Promise<ContentResource | null>
	createContentResource(resource: {
		id: string
		type: string
		fields: Record<string, any>
		createdById: string
	}): Awaitable<ContentResource>
	getContentResource(id: string): Promise<ContentResource | null>
	addResourceToProduct(options: {
		resource: ContentResource
		productId: string
		userId: string
	}): Promise<ContentResourceProduct | null>
	getEvent(
		id: string,
		options?: {
			withResources?: boolean
			withTags?: boolean
			withProducts?: boolean
			withPricing?: boolean
		},
	): Promise<ContentResource | null>
	createEvent(
		input: {
			type: 'event'
			fields: {
				title: string
				startsAt?: Date | null | undefined
				endsAt?: Date | null | undefined
				description?: string | null | undefined
				price?: number | null | undefined
				quantity?: number | null | undefined
				state?: string | null | undefined
				visibility?: string | null | undefined
				slug?: string | null | undefined
				tagIds?:
					| { id: string; fields: Record<string, any> }[]
					| null
					| undefined
			}
			coupon?: {
				enabled: boolean
				percentageDiscount?: string | undefined
				expires?: Date | undefined
			}
		},
		userId: string,
	): Promise<ContentResource | null>
	createEventSeries(
		input: {
			eventSeries: {
				type: 'event-series'
				fields: {
					title: string
					description?: string | undefined
					tagIds?:
						| { id: string; fields: { label: string; name: string } }[]
						| null
						| undefined
				}
				sharedFields: {
					price: number | null | undefined
					quantity: number | null | undefined
				}
			}
			childEvents: Array<{
				type: 'event'
				fields: {
					title: string
					startsAt: Date | null | undefined
					endsAt: Date | null | undefined
					description?: string | undefined
					tagIds?:
						| { id: string; fields: { label: string; name: string } }[]
						| null
						| undefined
				}
			}>
			coupon?: {
				enabled: boolean
				percentageDiscount?: string | undefined
				expires?: Date | undefined
			}
		},
		userId: string,
	): Promise<{
		eventSeries: ContentResource
		childEvents: ContentResource[]
	}>
	createCohort(
		input: {
			cohort: {
				title: string
				description?: string
				tagIds?:
					| { id: string; fields: { label: string; name: string } }[]
					| null
			}
			dates: {
				start: Date
				end: Date
			}
			createProduct?: boolean
			pricing: {
				price?: number | null
			}
			coupon?: {
				enabled: boolean
				percentageDiscount?: string
				expires?: Date
			}
			workshops: { id: string }[]
		},
		userId: string,
	): Promise<{
		cohort: ContentResource
		product?: any
	}>
	createWorkshop(
		input: {
			workshop: {
				title: string
				description?: string
				tagIds?:
					| { id: string; fields: { label: string; name: string } }[]
					| null
			}
			createProduct?: boolean
			pricing: {
				price?: number | null
				quantity?: number | null
			}
			coupon?: {
				enabled: boolean
				percentageDiscount?: string
				expires?: Date
			}
			structure: Array<
				| {
						type: 'section'
						title: string
						lessons: { title: string; videoResourceId?: string }[]
				  }
				| { type: 'lesson'; title: string; videoResourceId?: string }
			>
		},
		userId: string,
	): Promise<{
		workshop: ContentResource
		sections: ContentResource[]
		lessons: ContentResource[]
		product?: any
	}>
	createCoupon(input: {
		quantity: string
		maxUses: number
		expires: Date | null
		restrictedToProductId: string | null
		percentageDiscount: string
		status: number
		default: boolean
		fields: Record<string, any>
	}): Promise<string[]>
	getVideoResource(id: string | null | undefined): Promise<VideoResource | null>
	updateContentResourceFields(options: {
		id: string
		fields: Record<string, any>
	}): Awaitable<ContentResource | null>
	getPriceForProduct(productId: string): Promise<Price | null>
	getUpgradableProducts(options: {
		upgradableFromId: string
		upgradableToId: string
	}): Promise<UpgradableProduct[]>
	getMerchantCustomerForUserId(userId: string): Promise<MerchantCustomer | null>
	getMerchantAccount(options: {
		provider: 'stripe'
	}): Promise<MerchantAccount | null>
	createMerchantSession(options: {
		identifier: string
		merchantAccountId: string
		organizationId?: string
	}): Promise<MerchantSession>
	createMerchantCustomer(options: {
		userId: string
		identifier: string
		merchantAccountId: string
	}): Promise<MerchantCustomer | null>
	createMerchantCoupon(options: {
		identifier: string
		merchantAccountId: string
		type: string
		amountDiscount: number
	}): Promise<MerchantCoupon>
	getMerchantPriceForProductId(productId: string): Promise<MerchantPrice | null>
	transferPurchaseToUser(options: {
		purchaseId: string
		targetUserId: string
		sourceUserId: string
	}): Promise<PurchaseUserTransfer | null>
	createOrganization(options: { name: string }): Promise<Organization | null>
	getOrganization(organizationId: string): Promise<Organization | null>
	addMemberToOrganization(options: {
		organizationId: string
		userId: string
		invitedById: string
	}): Promise<OrganizationMember | null>
	removeMemberFromOrganization(options: {
		organizationId: string
		userId: string
	}): Promise<void>
	addRoleForMember(options: {
		organizationId: string
		memberId: string
		role: string
	}): Promise<void>
	removeRoleForMember(options: {
		organizationId: string
		memberId: string
		role: string
	}): Promise<void>
	getMembershipsForUser(userId: string): Promise<OrganizationMember[]>
	getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]>
	getMerchantSubscription(
		merchantSubscriptionId: string,
	): Promise<MerchantSubscription | null>
	createMerchantSubscription(options: {
		merchantAccountId: string
		merchantCustomerId: string
		merchantProductId: string
		identifier: string
	}): Promise<MerchantSubscription | null>
	updateMerchantSubscription(options: {
		merchantSubscriptionId: string
		status: string
	}): Promise<MerchantSubscription | null>
	deleteMerchantSubscription(merchantSubscriptionId: string): Promise<void>
	createSubscription(options: {
		organizationId: string
		merchantSubscriptionId: string
		productId: string
	}): Promise<Subscription | null>
	getSubscriptionForStripeId(
		stripeSubscriptionId: string,
	): Promise<Subscription | null>
	getPurchasesForBulkCouponId(
		bulkCouponId: string,
	): Promise<(Purchase & { user: User })[]>
	createMerchantEvent(options: {
		merchantAccountId: string
		identifier: string
		payload: Record<string, any>
	}): Promise<MerchantEvents>
	getMerchantEventByIdentifier(
		identifier: string,
	): Promise<MerchantEvents | null>
	getMerchantEventsByAccount(
		merchantAccountId: string,
	): Promise<MerchantEvents[]>
}

export const MockCourseBuilderAdapter: CourseBuilderAdapter = {
	client: null,
	transferPurchaseToUser: async () => {
		return null
	},
	redeemFullPriceCoupon: async () => {
		return {} as any
	},
	archiveProduct: async (productId) => {
		return {} as any
	},
	updateProduct: async (product) => {
		return {} as any
	},
	createProduct: async (product) => {
		return {} as any
	},
	createPurchaseTransfer: async () => {
		return Promise.resolve()
	},
	createCoupon: async (input) => {
		return []
	},
	addResourceToProduct: async (options) => {
		return null
	},
	incrementCouponUsedCount(_) {
		return Promise.resolve()
	},
	getExistingNonBulkValidPurchasesOfProduct: async () => {
		return []
	},
	getMerchantPriceForProductId: async (productId) => null,
	getMerchantProductForProductId: async (productId) => null,
	getMerchantAccount: async () => null,
	createMerchantCustomer: async () => null,
	createMerchantCoupon: async () => ({}) as MerchantCoupon,
	getMerchantCustomerForUserId: async () => null,
	getUpgradableProducts: async () => [],
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
		organizationId?: string
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
	createMerchantEvent(options: {
		merchantAccountId: string
		identifier: string
		payload: Record<string, any>
	}): Promise<MerchantEvents> {
		throw new Error('Method not implemented.')
	},
	getMerchantEventByIdentifier(
		identifier: string,
	): Promise<MerchantEvents | null> {
		return Promise.resolve(null)
	},
	getMerchantEventsByAccount(
		merchantAccountId: string,
	): Promise<MerchantEvents[]> {
		return Promise.resolve([])
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
				redeemedBulkCouponPurchases: Purchase[]
				bulkPurchase?: Purchase | null
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
	getModuleProgressForUser(
		userId: string,
		moduleId: string,
	): Promise<ModuleProgress> {
		return Promise.resolve({
			completedLessons: [],
			nextResource: null,
			percentCompleted: 0,
			completedLessonsCount: 0,
			totalLessonsCount: 0,
		})
	},
	getLessonProgresses(): Promise<ResourceProgress[]> {
		return Promise.resolve([])
	},
	getMerchantCharge(merchantChargeId: string): Promise<MerchantCharge | null> {
		return Promise.resolve(null)
	},
	getMerchantCouponForTypeAndPercent(params: {
		type: string
		percentageDiscount: number
	}): Promise<MerchantCoupon | null> {
		return Promise.resolve(null)
	},
	getMerchantCouponsForTypeAndPercent(params: {
		type: string
		percentageDiscount: number
	}): Promise<MerchantCoupon[]> {
		return Promise.resolve([])
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
	getPriceForProduct(productId: string): Promise<Price | null> {
		return Promise.resolve(null)
	},
	getProduct(
		productId?: string,
		withResources: boolean = true,
	): Promise<Product | null> {
		return Promise.resolve(null)
	},
	getProductResources(productId: string): Promise<ContentResource[] | null> {
		return Promise.resolve(null)
	},
	getPurchaseCountForProduct(productId: string): Promise<number> {
		return Promise.resolve(0)
	},
	getPurchase(purchaseId: string): Promise<Purchase | null> {
		return Promise.resolve(null)
	},
	getPurchaseDetails(
		purchaseId: string,
		userId: string,
	): Promise<{
		purchase?: Purchase
		existingPurchase?: Purchase | null
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
	getUserWithPurchasersByEmail(email: string): Promise<any | null> {
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
	removeResourceFromResource: async (options) => {
		return null
	},
	createContentResource: async (resource) => {
		return resource as ContentResource
	},
	getEvent: async (_) => {
		return null
	},
	createEvent: async (_) => {
		return null
	},
	createEventSeries: async (_) => {
		return { eventSeries: null as any, childEvents: [] }
	},
	createCohort: async (_) => {
		return { cohort: null as any, product: undefined }
	},
	createWorkshop: async (_) => {
		return {
			workshop: null as any,
			sections: [],
			lessons: [],
			product: undefined,
		}
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
	createOrganization: async () => null,
	getOrganization: async () => null,
	addMemberToOrganization: async () => null,
	removeMemberFromOrganization: async () => undefined,
	addRoleForMember: async () => undefined,
	removeRoleForMember: async () => undefined,
	getMembershipsForUser: async () => [],
	getOrganizationMembers: async () => [],
	getMerchantSubscription: async () => null,
	createMerchantSubscription: async () => null,
	updateMerchantSubscription: async () => null,
	deleteMerchantSubscription: async () => undefined,
	createMerchantSession: async () => Promise.resolve({} as MerchantSession),
	createSubscription: async () => null,
	getSubscriptionForStripeId: async () => null,
	getPurchasesForBulkCouponId: async () => [],
}

interface SkillProductsCommerceSdk {
	redeemFullPriceCoupon(options: {
		email: string
		couponId?: string
		redeemingProductId?: string
		productIds?: string[]
		currentUserId?: string | null
	}): Promise<{
		purchase: Purchase | null
		redeemingForCurrentUser: boolean
		error?: {
			message: string
		}
	} | null>
	createPurchaseTransfer(options: {
		sourceUserId: string
		purchaseId: string
		expiresAt: Date
	}): Promise<void>
	incrementCouponUsedCount(couponId: string): Promise<void>
	getExistingNonBulkValidPurchasesOfProduct(options: {
		userId: string
		productId?: string
	}): Promise<Purchase[]>
	getPurchaseDetails(
		purchaseId: string,
		userId: string,
	): Promise<{
		purchase?: Purchase
		existingPurchase?: Purchase | null
		availableUpgrades: UpgradableProduct[]
	}>
	getPurchaseForStripeCharge(stripeChargeId: string): Promise<Purchase | null>
	updatePurchaseStatusForCharge(
		chargeId: string,
		status: 'Valid' | 'Refunded' | 'Disputed' | 'Banned' | 'Restricted',
	): Promise<Purchase | undefined>
	couponForIdOrCode(options: {
		code?: string | null | undefined
		couponId?: string | null | undefined
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
	getModuleProgressForUser(
		userId: string,
		moduleId: string,
	): Promise<ModuleProgress | null>
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
	getCouponWithBulkPurchases(couponId?: string): Promise<
		| (Coupon & {
				redeemedBulkCouponPurchases?: Purchase[] | null
				bulkPurchase?: Purchase | null
		  })
		| null
	>
	getPurchase(purchaseId: string): Promise<Purchase | null>
	getPurchaseCountForProduct(productId: string): Promise<number>
	getPurchasesForUser(userId?: string): Promise<Purchase[]>
	getMerchantProduct(stripeProductId: string): Promise<MerchantProduct | null>
	getMerchantProductForProductId(
		productId: string,
	): Promise<MerchantProduct | null>
	getMerchantCharge(merchantChargeId: string): Promise<MerchantCharge | null>
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
		organizationId?: string
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
	getUserWithPurchasersByEmail(email: string): Promise<any | null>
	getProduct(
		productId?: string,
		withResources?: boolean,
	): Promise<Product | null>
	getProductResources(productId: string): Promise<ContentResource[] | null>
	getPrice(productId: string): Promise<Price | null>
	getMerchantCoupon(merchantCouponId: string): Promise<MerchantCoupon | null>
	getMerchantCouponForTypeAndPercent(params: {
		type: string
		percentageDiscount: number
	}): Promise<MerchantCoupon | null>
	getMerchantCouponsForTypeAndPercent(params: {
		type: string
		percentageDiscount: number
	}): Promise<MerchantCoupon[]>
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
