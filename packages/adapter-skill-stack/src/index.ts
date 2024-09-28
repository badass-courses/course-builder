/**
 * <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16}}>
 *  Official <a href="https://www.prisma.io/docs">Prisma</a> adapter for Auth.js / NextAuth.js.
 *  <a href="https://www.prisma.io/">
 *   <img style={{display: "block"}} src="https://authjs.dev/img/adapters/prisma.svg" width="38" />
 *  </a>
 * </div>
 *
 * ## Installation
 *
 * ```bash npm2yarn
 * npm install @prisma/client @auth/prisma-adapter
 * npm install prisma --save-dev
 * ```
 *
 * @module @auth/prisma-adapter
 */
import type {
	AdapterAccount,
	AdapterSession,
	AdapterUser,
} from '@auth/core/adapters'
import type { Prisma, PrismaClient } from '@prisma/client'

import type { CourseBuilderAdapter } from '@coursebuilder/core/adapters'
import {
	ContentResource,
	ContentResourceResource,
	Coupon,
	MerchantCharge,
	MerchantCoupon,
	MerchantCustomer,
	MerchantPrice,
	MerchantProduct,
	ModuleProgress,
	NewProduct,
	Price,
	Product,
	Purchase,
	PurchaseUserTransfer,
	PurchaseUserTransferState,
	ResourceProgress,
	UpgradableProduct,
	User,
	VideoResource,
} from '@coursebuilder/core/schemas'
import { MerchantAccount } from '@coursebuilder/core/schemas/merchant-account-schema'
import { Awaitable } from '@coursebuilder/core/types'

export function PrismaAdapter(
	prisma: PrismaClient | ReturnType<PrismaClient['$extends']>,
): CourseBuilderAdapter {
	const p = prisma as PrismaClient
	return {
		client: undefined,
		addResourceToResource(options: {
			childResourceId: string
			parentResourceId: string
		}): Awaitable<ContentResourceResource | null> {
			throw new Error('Method not implemented.')
		},
		archiveProduct(productId: string): Promise<Product | null> {
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
			throw new Error('Method not implemented.')
		},
		clearLessonProgressForUser(options: {
			userId: string
			lessons: { id: string; slug: string }[]
		}): Promise<void> {
			throw new Error('Method not implemented.')
		},
		completeLessonProgressForUser(options: {
			userId: string
			lessonId?: string
		}): Promise<ResourceProgress | null> {
			throw new Error('Method not implemented.')
		},
		couponForIdOrCode(options: {
			code?: string | null | undefined
			couponId?: string | null | undefined
		}): Promise<(Coupon & { merchantCoupon: MerchantCoupon }) | null> {
			throw new Error('Method not implemented.')
		},
		createContentResource(resource: {
			id: string
			type: string
			fields: Record<string, any>
			createdById: string
		}): Awaitable<ContentResource> {
			throw new Error('Method not implemented.')
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
			appliedPPPStripeCouponId: string | undefined
			upgradedFromPurchaseId: string | undefined
			usedCouponId: string | undefined
			country?: string
		}): Promise<Purchase> {
			throw new Error('Method not implemented.')
		},
		createMerchantCustomer(options: {
			userId: string
			identifier: string
			merchantAccountId: string
		}): Promise<MerchantCustomer | null> {
			throw new Error('Method not implemented.')
		},
		createProduct(product: NewProduct): Promise<Product | null> {
			throw new Error('Method not implemented.')
		},
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
		}): Promise<Purchase> {
			throw new Error('Method not implemented.')
		},
		createPurchaseTransfer(options: {
			sourceUserId: string
			purchaseId: string
			expiresAt: Date
		}): Promise<void> {
			throw new Error('Method not implemented.')
		},
		findOrCreateMerchantCustomer(options: {
			user: User
			identifier: string
			merchantAccountId: string
		}): Promise<MerchantCustomer | null> {
			throw new Error('Method not implemented.')
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
		getContentResource(id: string): Promise<ContentResource | null> {
			throw new Error('Method not implemented.')
		},
		getCoupon(couponIdOrCode: string): Promise<Coupon | null> {
			throw new Error('Method not implemented.')
		},
		getCouponWithBulkPurchases(couponId?: string): Promise<
			| (Coupon & {
					redeemedBulkCouponPurchases?: Purchase[] | null
					bulkPurchase?: Purchase | null
			  })
			| null
		> {
			throw new Error('Method not implemented.')
		},
		getDefaultCoupon(productIds?: string[]): Promise<{
			defaultMerchantCoupon: MerchantCoupon
			defaultCoupon: Coupon
		} | null> {
			throw new Error('Method not implemented.')
		},
		getExistingNonBulkValidPurchasesOfProduct(options: {
			userId: string
			productId?: string
		}): Promise<Purchase[]> {
			throw new Error('Method not implemented.')
		},
		getLessonProgressCountsByDate(): Promise<
			{
				count: number
				completedAt: string
			}[]
		> {
			throw new Error('Method not implemented.')
		},
		getLessonProgressForUser(
			userId: string,
		): Promise<ResourceProgress[] | null> {
			throw new Error('Method not implemented.')
		},
		getLessonProgresses(): Promise<ResourceProgress[]> {
			throw new Error('Method not implemented.')
		},
		getMerchantAccount(options: {
			provider: 'stripe'
		}): Promise<MerchantAccount | null> {
			throw new Error('Method not implemented.')
		},
		getMerchantCharge(
			merchantChargeId: string,
		): Promise<MerchantCharge | null> {
			throw new Error('Method not implemented.')
		},
		getMerchantCoupon(
			merchantCouponId: string,
		): Promise<MerchantCoupon | null> {
			throw new Error('Method not implemented.')
		},
		getMerchantCouponForTypeAndPercent(params: {
			type: string
			percentageDiscount: number
		}): Promise<MerchantCoupon | null> {
			throw new Error('Method not implemented.')
		},
		getMerchantCouponsForTypeAndPercent(params: {
			type: string
			percentageDiscount: number
		}): Promise<MerchantCoupon[]> {
			throw new Error('Method not implemented.')
		},
		getMerchantCustomerForUserId(
			userId: string,
		): Promise<MerchantCustomer | null> {
			throw new Error('Method not implemented.')
		},
		getMerchantPriceForProductId(
			productId: string,
		): Promise<MerchantPrice | null> {
			throw new Error('Method not implemented.')
		},
		getMerchantProduct(
			stripeProductId: string,
		): Promise<MerchantProduct | null> {
			throw new Error('Method not implemented.')
		},
		getMerchantProductForProductId(
			productId: string,
		): Promise<MerchantProduct | null> {
			throw new Error('Method not implemented.')
		},
		getModuleProgressForUser(
			userId: string,
			moduleId: string,
		): Promise<ModuleProgress | null> {
			throw new Error('Method not implemented.')
		},
		getPrice(productId: string): Promise<Price | null> {
			throw new Error('Method not implemented.')
		},
		getPriceForProduct(productId: string): Promise<Price | null> {
			throw new Error('Method not implemented.')
		},
		getProduct(
			productId?: string,
			withResources?: boolean,
		): Promise<Product | null> {
			throw new Error('Method not implemented.')
		},
		getProductResources(productId: string): Promise<ContentResource[] | null> {
			throw new Error('Method not implemented.')
		},
		getPurchase(purchaseId: string): Promise<Purchase | null> {
			throw new Error('Method not implemented.')
		},
		getPurchaseCountForProduct(productId: string): Promise<number> {
			throw new Error('Method not implemented.')
		},
		getPurchaseDetails(
			purchaseId: string,
			userId: string,
		): Promise<{
			purchase?: Purchase
			existingPurchase?: Purchase | null
			availableUpgrades: UpgradableProduct[]
		}> {
			throw new Error('Method not implemented.')
		},
		getPurchaseForStripeCharge(
			stripeChargeId: string,
		): Promise<Purchase | null> {
			throw new Error('Method not implemented.')
		},
		getPurchaseUserTransferById(options: { id: string }): Promise<
			| (PurchaseUserTransfer & {
					sourceUser: User
					targetUser: User | null
					purchase: Purchase
			  })
			| null
		> {
			throw new Error('Method not implemented.')
		},
		getPurchaseWithUser(purchaseId: string): Promise<
			| (Purchase & {
					user: User
			  })
			| null
		> {
			throw new Error('Method not implemented.')
		},
		getPurchasesForUser(userId?: string): Promise<Purchase[]> {
			throw new Error('Method not implemented.')
		},
		getUpgradableProducts(options: {
			upgradableFromId: string
			upgradableToId: string
		}): Promise<UpgradableProduct[]> {
			throw new Error('Method not implemented.')
		},
		getUserById(userId: string): Promise<User | null> {
			throw new Error('Method not implemented.')
		},
		getUserWithPurchasersByEmail(email: string): Promise<any> {
			throw new Error('Method not implemented.')
		},
		getVideoResource(
			id: string | null | undefined,
		): Promise<VideoResource | null> {
			throw new Error('Method not implemented.')
		},
		incrementCouponUsedCount(couponId: string): Promise<void> {
			throw new Error('Method not implemented.')
		},
		pricesOfPurchasesTowardOneBundle(options: {
			userId: string | undefined
			bundleId: string
		}): Promise<Price[]> {
			throw new Error('Method not implemented.')
		},
		redeemFullPriceCoupon(options: {
			email: string
			couponId?: string
			redeemingProductId?: string
			productIds?: string[]
			currentUserId?: string | null
		}): Promise<{
			purchase: Purchase | null
			redeemingForCurrentUser: boolean
			error?: { message: string }
		} | null> {
			throw new Error('Method not implemented.')
		},
		removeResourceFromResource(options: {
			childResourceId: string
			parentResourceId: string
		}): Promise<ContentResource | null> {
			throw new Error('Method not implemented.')
		},
		toggleLessonProgressForUser(options: {
			userId: string
			lessonId?: string
			lessonSlug?: string
		}): Promise<ResourceProgress | null> {
			throw new Error('Method not implemented.')
		},
		transferPurchaseToUser(options: {
			purchaseId: string
			targetUserId: string
			sourceUserId: string
		}): Promise<PurchaseUserTransfer | null> {
			throw new Error('Method not implemented.')
		},
		transferPurchasesToNewUser(options: {
			merchantCustomerId: string
			userId: string
		}): Promise<unknown> {
			throw new Error('Method not implemented.')
		},
		updateContentResourceFields(options: {
			id: string
			fields: Record<string, any>
		}): Awaitable<ContentResource | null> {
			throw new Error('Method not implemented.')
		},
		updateProduct(product: Product): Promise<Product | null> {
			throw new Error('Method not implemented.')
		},
		updatePurchaseStatusForCharge(
			chargeId: string,
			status: 'Valid' | 'Refunded' | 'Disputed' | 'Banned' | 'Restricted',
		): Promise<Purchase | undefined> {
			throw new Error('Method not implemented.')
		},
		updatePurchaseUserTransferTransferState(options: {
			id: string
			transferState: PurchaseUserTransferState
		}): Promise<PurchaseUserTransfer | null> {
			throw new Error('Method not implemented.')
		},
		// We need to let Prisma generate the ID because our default UUID is incompatible with MongoDB
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		createUser: ({ id, ...data }) => {
			return p.user.create({ data })
		},
		getUser: (id) => p.user.findUnique({ where: { id } }),
		getUserByEmail: (email) => p.user.findUnique({ where: { email } }),
		async getUserByAccount(provider_providerAccountId) {
			const account = await p.account.findUnique({
				where: { provider_providerAccountId },
				select: { user: true },
			})
			return (account?.user as AdapterUser) ?? null
		},
		updateUser: ({ id, ...data }) =>
			p.user.update({ where: { id }, data }) as Promise<AdapterUser>,
		deleteUser: (id) =>
			p.user.delete({ where: { id } }) as Promise<AdapterUser>,
		linkAccount: (data) =>
			p.account.create({ data }) as unknown as AdapterAccount,
		unlinkAccount: (provider_providerAccountId) =>
			p.account.delete({
				where: { provider_providerAccountId },
			}) as unknown as AdapterAccount,
		async getSessionAndUser(sessionToken) {
			const userAndSession = await p.session.findUnique({
				where: { sessionToken },
				include: { user: true },
			})
			if (!userAndSession) return null
			const { user, ...session } = userAndSession
			return { user, session } as { user: AdapterUser; session: AdapterSession }
		},
		createSession: (data) => p.session.create({ data }),
		updateSession: (data) =>
			p.session.update({ where: { sessionToken: data.sessionToken }, data }),
		deleteSession: (sessionToken) =>
			p.session.delete({ where: { sessionToken } }),
		async createVerificationToken(data) {
			const verificationToken = await p.verificationToken.create({ data })
			// @ts-expect-errors // MongoDB needs an ID, but we don't
			if (verificationToken.id) delete verificationToken.id
			return verificationToken
		},
		async useVerificationToken(identifier_token) {
			try {
				const verificationToken = await p.verificationToken.delete({
					where: { identifier_token },
				})
				// @ts-expect-errors // MongoDB needs an ID, but we don't
				if (verificationToken.id) delete verificationToken.id
				return verificationToken
			} catch (error) {
				// If token already used/deleted, just return null
				// https://www.prisma.io/docs/reference/api-reference/error-reference#p2025
				if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2025')
					return null
				throw error
			}
		},
		async getAccount(providerAccountId, provider) {
			return p.account.findFirst({
				where: { providerAccountId, provider },
			}) as Promise<AdapterAccount | null>
		},
	}
}
