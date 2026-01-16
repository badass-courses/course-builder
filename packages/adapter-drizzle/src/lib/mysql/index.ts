import type { AdapterSession, AdapterUser } from '@auth/core/adapters'
import slugify from '@sindresorhus/slugify'
import { addSeconds, isAfter } from 'date-fns'
import {
	and,
	asc,
	count,
	desc,
	eq,
	gte,
	inArray,
	isNotNull,
	isNull,
	not,
	or,
	sql,
} from 'drizzle-orm'
import {
	mysqlTable as defaultMySqlTableFn,
	MySqlDatabase,
	MySqlTableFn,
} from 'drizzle-orm/mysql-core'
import { customAlphabet } from 'nanoid'
import { v4 } from 'uuid'
import { z } from 'zod'

import { type CourseBuilderAdapter } from '@coursebuilder/core/adapters'
import {
	Coupon,
	couponSchema,
	Entitlement,
	entitlementSchema,
	MerchantCharge,
	merchantChargeSchema,
	MerchantCoupon,
	merchantCouponSchema,
	MerchantCustomer,
	MerchantEvents,
	merchantEventsSchema,
	merchantPriceSchema,
	MerchantProduct,
	merchantProductSchema,
	NewProduct,
	Price,
	priceSchema,
	Product,
	productSchema,
	Purchase,
	purchaseSchema,
	PurchaseUserTransfer,
	purchaseUserTransferSchema,
	PurchaseUserTransferState,
	ResourceProgress,
	resourceProgressSchema,
	UpgradableProduct,
	upgradableProductSchema,
	User,
	userSchema,
} from '@coursebuilder/core/schemas'
import {
	ContentResourceProductSchema,
	ContentResourceResourceSchema,
	ContentResourceSchema,
	type ContentResource,
} from '@coursebuilder/core/schemas/content-resource-schema'
import { merchantAccountSchema } from '@coursebuilder/core/schemas/merchant-account-schema'
import { merchantCustomerSchema } from '@coursebuilder/core/schemas/merchant-customer-schema'
import {
	MerchantSession,
	MerchantSessionSchema,
} from '@coursebuilder/core/schemas/merchant-session'
import { MerchantSubscriptionSchema } from '@coursebuilder/core/schemas/merchant-subscription'
import { OrganizationMemberSchema } from '@coursebuilder/core/schemas/organization-member'
import { OrganizationSchema } from '@coursebuilder/core/schemas/organization-schema'
import { type ModuleProgress } from '@coursebuilder/core/schemas/resource-progress-schema'
import { SubscriptionSchema } from '@coursebuilder/core/schemas/subscription'
import { VideoResourceSchema } from '@coursebuilder/core/schemas/video-resource'
import { PaymentsProviderConfig } from '@coursebuilder/core/types'
import { logger } from '@coursebuilder/core/utils/logger'
import { validateCoupon } from '@coursebuilder/core/utils/validate-coupon'

import {
	getAccountsRelationsSchema,
	getAccountsSchema,
} from './schemas/auth/accounts.js'
import {
	getDeviceAccessTokenRelationsSchema,
	getDeviceAccessTokenSchema,
} from './schemas/auth/device-access-token.js'
import {
	getDeviceVerificationRelationsSchema,
	getDeviceVerificationSchema,
} from './schemas/auth/device-verification.js'
import {
	getPermissionsRelationsSchema,
	getPermissionsSchema,
} from './schemas/auth/permissions.js'
import {
	getProfilesRelationsSchema,
	getProfilesSchema,
} from './schemas/auth/profiles.js'
import {
	getRolePermissionsRelationsSchema,
	getRolePermissionsSchema,
} from './schemas/auth/role-permissions.js'
import {
	getRolesRelationsSchema,
	getRolesSchema,
} from './schemas/auth/roles.js'
import {
	getSessionRelationsSchema,
	getSessionsSchema,
} from './schemas/auth/sessions.js'
import {
	getUserPermissionsRelationsSchema,
	getUserPermissionsSchema,
} from './schemas/auth/user-permissions.js'
import {
	getUserPrefsRelationsSchema,
	getUserPrefsSchema,
} from './schemas/auth/user-prefs.js'
import {
	getUserRolesRelationsSchema,
	getUserRolesSchema,
} from './schemas/auth/user-roles.js'
import {
	getUsersRelationsSchema,
	getUsersSchema,
} from './schemas/auth/users.js'
import { getVerificationTokensSchema } from './schemas/auth/verification-tokens.js'
import {
	getCouponRelationsSchema,
	getCouponSchema,
} from './schemas/commerce/coupon.js'
import { getMerchantAccountSchema } from './schemas/commerce/merchant-account.js'
import {
	getMerchantChargeRelationsSchema,
	getMerchantChargeSchema,
} from './schemas/commerce/merchant-charge.js'
import { getMerchantCouponSchema } from './schemas/commerce/merchant-coupon.js'
import { getMerchantCustomerSchema } from './schemas/commerce/merchant-customer.js'
import {
	getMerchantEventsRelationsSchema,
	getMerchantEventsSchema,
} from './schemas/commerce/merchant-events.js'
import { getMerchantPriceSchema } from './schemas/commerce/merchant-price.js'
import { getMerchantProductSchema } from './schemas/commerce/merchant-product.js'
import { getMerchantSessionSchema } from './schemas/commerce/merchant-session.js'
import {
	getMerchantSubscriptionRelationsSchema,
	getMerchantSubscriptionSchema,
} from './schemas/commerce/merchant-subscription.js'
import { getPriceSchema } from './schemas/commerce/price.js'
import {
	getProductRelationsSchema,
	getProductSchema,
} from './schemas/commerce/product.js'
import {
	getPurchaseUserTransferRelationsSchema,
	getPurchaseUserTransferSchema,
} from './schemas/commerce/purchase-user-transfer.js'
import {
	getPurchaseRelationsSchema,
	getPurchaseSchema,
} from './schemas/commerce/purchase.js'
import {
	getSubscriptionRelationsSchema,
	getSubscriptionSchema,
} from './schemas/commerce/subscription.js'
import {
	getUpgradableProductsRelationsSchema,
	getUpgradableProductsSchema,
} from './schemas/commerce/upgradable-products.js'
import {
	getCommentRelationsSchema,
	getCommentsSchema,
} from './schemas/communication/comment.js'
import { getCommunicationChannelSchema } from './schemas/communication/communication-channel.js'
import { getCommunicationPreferenceTypesSchema } from './schemas/communication/communication-preference-types.js'
import {
	getCommunicationPreferencesRelationsSchema,
	getCommunicationPreferencesSchema,
} from './schemas/communication/communication-preferences.js'
import {
	getQuestionResponseRelationsSchema,
	getQuestionResponseSchema,
} from './schemas/communication/question-response.js'
import {
	getContentContributionRelationsSchema,
	getContentContributionsSchema,
} from './schemas/content/content-contributions.js'
import {
	getContentResourceAuthorRelationsSchema,
	getContentResourceAuthorSchema,
} from './schemas/content/content-resource-author.js'
import {
	getContentResourceProductRelationsSchema,
	getContentResourceProductSchema,
} from './schemas/content/content-resource-product.js'
import {
	getContentResourceResourceRelationsSchema,
	getContentResourceResourceSchema,
} from './schemas/content/content-resource-resource.js'
import {
	getContentResourceTagRelationsSchema,
	getContentResourceTagSchema,
} from './schemas/content/content-resource-tag.js'
import {
	getContentResourceVersionRelationsSchema,
	getContentResourceVersionSchema,
} from './schemas/content/content-resource-version.js'
import {
	getContentResourceRelationsSchema,
	getContentResourceSchema,
} from './schemas/content/content-resource.js'
import {
	getContributionTypesRelationsSchema,
	getContributionTypesSchema,
} from './schemas/content/contribution-types.js'
import { getLessonProgressSchema } from './schemas/content/lesson-progress.js'
import { getResourceProgressSchema } from './schemas/content/resource-progress.js'
import {
	getTagTagRelationsSchema,
	getTagTagSchema,
} from './schemas/content/tag-tag.js'
import { getTagRelationsSchema, getTagSchema } from './schemas/content/tag.js'
import { getEntitlementTypesSchema } from './schemas/entitlements/entitlement-type.js'
import {
	getEntitlementRelationsSchema,
	getEntitlementsSchema,
} from './schemas/entitlements/entitlement.js'
import {
	getOrganizationMembershipRolesRelationsSchema,
	getOrganizationMembershipRolesSchema,
} from './schemas/org/organization-membership-roles.js'
import {
	getOrganizationMembershipsRelationsSchema,
	getOrganizationMembershipsSchema,
} from './schemas/org/organization-memberships.js'
import {
	getOrganizationsRelationsSchema,
	getOrganizationsSchema,
} from './schemas/org/organizations.js'

export const guid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 5)

export const normalizeExpirationDate = (date: Date | undefined) => {
	if (!date) return undefined

	// Create a new Date object for 23:59:59 UTC on the date part of the input date
	// The input date should be a JS Date representing 00:00:00 LA time for the chosen day.
	// Its UTC date parts (getUTCFullYear, etc.) will give us the correct calendar day.
	return new Date(
		Date.UTC(
			date.getUTCFullYear(),
			date.getUTCMonth(), // 0-indexed
			date.getUTCDate(),
			23, // hours
			59, // minutes
			59, // seconds
			0, // milliseconds
		),
	)
}

export function getCourseBuilderSchema(mysqlTable: MySqlTableFn) {
	return {
		accounts: getAccountsSchema(mysqlTable),
		accountsRelations: getAccountsRelationsSchema(mysqlTable),
		permissions: getPermissionsSchema(mysqlTable),
		permissionsRelations: getPermissionsRelationsSchema(mysqlTable),
		rolePermissions: getRolePermissionsSchema(mysqlTable),
		rolePermissionsRelations: getRolePermissionsRelationsSchema(mysqlTable),
		roles: getRolesSchema(mysqlTable),
		rolesRelations: getRolesRelationsSchema(mysqlTable),
		sessions: getSessionsSchema(mysqlTable),
		sessionsRelations: getSessionRelationsSchema(mysqlTable),
		userPermissions: getUserPermissionsSchema(mysqlTable),
		userPermissionsRelations: getUserPermissionsRelationsSchema(mysqlTable),
		userRoles: getUserRolesSchema(mysqlTable),
		userRolesRelations: getUserRolesRelationsSchema(mysqlTable),
		users: getUsersSchema(mysqlTable),
		usersRelations: getUsersRelationsSchema(mysqlTable),
		verificationTokens: getVerificationTokensSchema(mysqlTable),
		coupon: getCouponSchema(mysqlTable),
		couponRelations: getCouponRelationsSchema(mysqlTable),
		lessonProgress: getLessonProgressSchema(mysqlTable),
		merchantAccount: getMerchantAccountSchema(mysqlTable),
		merchantCharge: getMerchantChargeSchema(mysqlTable),
		merchantChargeRelations: getMerchantChargeRelationsSchema(mysqlTable),
		merchantEvents: getMerchantEventsSchema(mysqlTable),
		merchantEventsRelations: getMerchantEventsRelationsSchema(mysqlTable),
		merchantCoupon: getMerchantCouponSchema(mysqlTable),
		merchantCustomer: getMerchantCustomerSchema(mysqlTable),
		merchantPrice: getMerchantPriceSchema(mysqlTable),
		merchantProduct: getMerchantProductSchema(mysqlTable),
		merchantSession: getMerchantSessionSchema(mysqlTable),
		prices: getPriceSchema(mysqlTable),
		products: getProductSchema(mysqlTable),
		purchases: getPurchaseSchema(mysqlTable),
		purchaseRelations: getPurchaseRelationsSchema(mysqlTable),
		purchaseUserTransfer: getPurchaseUserTransferSchema(mysqlTable),
		purchaseUserTransferRelations:
			getPurchaseUserTransferRelationsSchema(mysqlTable),
		communicationChannel: getCommunicationChannelSchema(mysqlTable),
		communicationPreferenceTypes:
			getCommunicationPreferenceTypesSchema(mysqlTable),
		communicationPreferences: getCommunicationPreferencesSchema(mysqlTable),
		communicationPreferencesRelations:
			getCommunicationPreferencesRelationsSchema(mysqlTable),
		contentContributions: getContentContributionsSchema(mysqlTable),
		contentContributionRelations:
			getContentContributionRelationsSchema(mysqlTable),
		contentResource: getContentResourceSchema(mysqlTable),
		contentResourceVersion: getContentResourceVersionSchema(mysqlTable),
		contentResourceVersionRelations:
			getContentResourceVersionRelationsSchema(mysqlTable),
		contentResourceRelations: getContentResourceRelationsSchema(mysqlTable),
		contentResourceAuthor: getContentResourceAuthorSchema(mysqlTable),
		contentResourceAuthorRelations:
			getContentResourceAuthorRelationsSchema(mysqlTable),
		contentResourceResource: getContentResourceResourceSchema(mysqlTable),
		contentResourceResourceRelations:
			getContentResourceResourceRelationsSchema(mysqlTable),
		contentResourceTag: getContentResourceTagSchema(mysqlTable),
		contentResourceTagRelations:
			getContentResourceTagRelationsSchema(mysqlTable),
		contributionTypes: getContributionTypesSchema(mysqlTable),
		contributionTypesRelations: getContributionTypesRelationsSchema(mysqlTable),
		resourceProgress: getResourceProgressSchema(mysqlTable),
		questionResponse: getQuestionResponseSchema(mysqlTable),
		questionResponseRelations: getQuestionResponseRelationsSchema(mysqlTable),
		upgradableProducts: getUpgradableProductsSchema(mysqlTable),
		upgradableProductsRelations:
			getUpgradableProductsRelationsSchema(mysqlTable),
		contentResourceProduct: getContentResourceProductSchema(mysqlTable),
		contentResourceProductRelations:
			getContentResourceProductRelationsSchema(mysqlTable),
		productRelations: getProductRelationsSchema(mysqlTable),
		comments: getCommentsSchema(mysqlTable),
		commentsRelations: getCommentRelationsSchema(mysqlTable),
		deviceVerifications: getDeviceVerificationSchema(mysqlTable),
		deviceVerificationRelations:
			getDeviceVerificationRelationsSchema(mysqlTable),
		deviceAccessToken: getDeviceAccessTokenSchema(mysqlTable),
		deviceAccessTokenRelations: getDeviceAccessTokenRelationsSchema(mysqlTable),
		tag: getTagSchema(mysqlTable),
		tagRelations: getTagRelationsSchema(mysqlTable),
		tagTag: getTagTagSchema(mysqlTable),
		tagTagRelations: getTagTagRelationsSchema(mysqlTable),
		userPrefs: getUserPrefsSchema(mysqlTable),
		userPrefsRelations: getUserPrefsRelationsSchema(mysqlTable),
		organization: getOrganizationsSchema(mysqlTable),
		organizationRelations: getOrganizationsRelationsSchema(mysqlTable),
		organizationMemberships: getOrganizationMembershipsSchema(mysqlTable),
		organizationMembershipRelations:
			getOrganizationMembershipsRelationsSchema(mysqlTable),
		organizationMembershipRoles:
			getOrganizationMembershipRolesSchema(mysqlTable),
		organizationMembershipRolesRelations:
			getOrganizationMembershipRolesRelationsSchema(mysqlTable),
		merchantSubscription: getMerchantSubscriptionSchema(mysqlTable),
		merchantSubscriptionRelations:
			getMerchantSubscriptionRelationsSchema(mysqlTable),
		subscription: getSubscriptionSchema(mysqlTable),
		subscriptionRelations: getSubscriptionRelationsSchema(mysqlTable),
		profiles: getProfilesSchema(mysqlTable),
		profilesRelations: getProfilesRelationsSchema(mysqlTable),
		entitlementTypes: getEntitlementTypesSchema(mysqlTable),
		entitlements: getEntitlementsSchema(mysqlTable),
		entitlementsRelations: getEntitlementRelationsSchema(mysqlTable),
	} as const
}

export function createTables(mySqlTable: MySqlTableFn) {
	return getCourseBuilderSchema(mySqlTable)
}

export type DefaultSchema = ReturnType<typeof createTables>

export function mySqlDrizzleAdapter(
	client: InstanceType<typeof MySqlDatabase>,
	tableFn = defaultMySqlTableFn,
	paymentProvider?: PaymentsProviderConfig,
): CourseBuilderAdapter<typeof MySqlDatabase> {
	const {
		users,
		accounts,
		sessions,
		verificationTokens,
		contentResource,
		contentResourceAuthor,
		contentResourceResource,
		contentResourceProduct,
		contentResourceTag,
		purchases: purchaseTable,
		purchaseUserTransfer,
		coupon,
		merchantCoupon,
		merchantCharge,
		merchantAccount,
		merchantEvents,
		merchantPrice,
		merchantCustomer,
		merchantSession,
		merchantProduct,
		prices,
		products,
		upgradableProducts,
		resourceProgress,
		comments,
		organization: organizationTable,
		organizationMemberships: organizationMembershipTable,
		organizationMembershipRoles: organizationMembershipRoleTable,
		roles: roleTable,
		merchantSubscription: merchantSubscriptionTable,
		subscription: subscriptionTable,
		entitlements: entitlementTable,
		entitlementTypes,
	} = createTables(tableFn)

	const adapter: CourseBuilderAdapter = {
		client,
		async redeemFullPriceCoupon(options) {
			const {
				email: baseEmail,
				couponId,
				productIds,
				currentUserId,
				redeemingProductId,
			} = options
			const email = String(baseEmail).replace(' ', '+')

			const coupon = await adapter.getCouponWithBulkPurchases(couponId)

			const productId =
				(coupon && (coupon.restrictedToProductId as string)) ||
				redeemingProductId

			if (!productId) throw new Error(`unable-to-find-any-product-id`)

			const couponValidation = validateCoupon(coupon, productIds)

			if (coupon && couponValidation.isRedeemable) {
				// if the Coupon is the Bulk Coupon of a Bulk Purchase,
				// then a bulk coupon is being redeemed
				const bulkCouponRedemption = Boolean(coupon.maxUses > 1)

				const { user } = await adapter.findOrCreateUser(email)

				if (!user) throw new Error(`unable-to-create-user-${email}`)

				const currentUser = currentUserId
					? await adapter.getUserById(currentUserId)
					: null

				const redeemingForCurrentUser = currentUser?.id === user.id

				// To prevent double-purchasing, check if this user already has a
				// Purchase record for this product that is valid and wasn't a bulk
				// coupon purchase.
				const existingPurchases =
					await adapter.getExistingNonBulkValidPurchasesOfProduct({
						userId: user.id,
						productId,
					})

				if (existingPurchases.length > 0) {
					const errorMessage = `already-purchased-${email}`
					console.error(errorMessage)
					return {
						error: {
							message: errorMessage,
						},
						redeemingForCurrentUser,
						purchase: null,
					}
					throw new Error(errorMessage)
				}

				const purchaseId = `purchase-${v4()}`
				const userMemberships = await adapter.getMembershipsForUser(user.id)
				const organizationId =
					coupon.organizationId ||
					userMemberships.find((m) => m.organization.name?.includes(user.email))
						?.organizationId // safer way to make sure we are using personal organization

				await adapter.createPurchase({
					id: purchaseId,
					userId: user.id,
					couponId: bulkCouponRedemption ? null : coupon.id,
					redeemedBulkCouponId: bulkCouponRedemption ? coupon.id : null,
					productId,
					totalAmount: '0',
					organizationId,
					metadata: {
						couponUsedId: bulkCouponRedemption ? null : coupon.id,
					},
				})

				const newPurchase = await adapter.getPurchase(purchaseId)

				await adapter.incrementCouponUsedCount(coupon.id)

				await adapter.createPurchaseTransfer({
					sourceUserId: user.id,
					purchaseId: purchaseId,
					expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
				})

				return { purchase: newPurchase, redeemingForCurrentUser }
			}

			return null
		},
		createPurchaseTransfer: async (options) => {
			const id = `put_${v4()}`
			await client.insert(purchaseUserTransfer).values({
				id,
				purchaseId: options.purchaseId,
				sourceUserId: options.sourceUserId,
				expiresAt: options.expiresAt,
			})
		},
		incrementCouponUsedCount: async (couponId) => {
			await client
				.update(coupon)
				.set({ usedCount: sql`${coupon.usedCount} + 1` })
				.where(eq(coupon.id, couponId))
		},
		getExistingNonBulkValidPurchasesOfProduct: async ({
			userId,
			productId,
		}) => {
			const existingPurchases = await client.query.purchases.findMany({
				where: and(
					eq(purchaseTable.userId, userId),
					productId ? eq(purchaseTable.productId, productId) : undefined,
					eq(purchaseTable.status, 'Valid'),
					isNull(purchaseTable.bulkCouponId),
				),
			})

			return z.array(purchaseSchema).parse(existingPurchases)
		},
		createMerchantCustomer: async (options) => {
			await client.insert(merchantCustomer).values({
				id: `mc_${v4()}`,
				identifier: options.identifier,
				merchantAccountId: options.merchantAccountId,
				userId: options.userId,
				status: 1,
			})
			return merchantCustomerSchema.parse(
				await client.query.merchantCustomer.findFirst({
					where: eq(merchantCustomer.identifier, options.identifier),
				}),
			)
		},
		createMerchantCoupon: async (options) => {
			await client.insert(merchantCoupon).values({
				id: `mcoupon_${v4()}`,
				identifier: options.identifier,
				merchantAccountId: options.merchantAccountId,
				type: options.type,
				amountDiscount: Math.floor(options.amountDiscount),
				status: 1,
			})
			return merchantCouponSchema.parse(
				await client.query.merchantCoupon.findFirst({
					where: eq(merchantCoupon.identifier, options.identifier),
				}),
			)
		},
		getMerchantAccount: async (options) => {
			return merchantAccountSchema.parse(
				await client.query.merchantAccount.findFirst({
					where: eq(merchantAccount.label, options.provider),
				}),
			)
		},
		getMerchantPriceForProductId: async (productId) => {
			const merchantPriceData = await client.query.merchantPrice.findFirst({
				where: and(
					eq(merchantPrice.merchantProductId, productId),
					eq(merchantPrice.status, 1),
				),
			})

			const parsedMerchantPrice =
				merchantPriceSchema.safeParse(merchantPriceData)

			if (!parsedMerchantPrice.success) {
				console.error(
					'Error parsing merchant price',
					JSON.stringify(parsedMerchantPrice.error),
				)
				return null
			}

			return parsedMerchantPrice.data
		},
		getMerchantProductForProductId: async (productId) => {
			const merchantProductData = await client.query.merchantProduct.findFirst({
				where: eq(merchantProduct.productId, productId),
			})

			if (!merchantProductData) return null
			return merchantProductSchema.parse(merchantProductData)
		},
		getMerchantCustomerForUserId: async (userId) => {
			const merchantCustomerData =
				await client.query.merchantCustomer.findFirst({
					where: eq(merchantCustomer.userId, userId),
				})

			if (!merchantCustomerData) return null
			return merchantCustomerSchema.parse(merchantCustomerData)
		},
		getUpgradableProducts: async (options) => {
			const { upgradableFromId, upgradableToId } = options
			return z.array(upgradableProductSchema).parse(
				await client.query.upgradableProducts.findMany({
					where: and(
						eq(upgradableProducts.upgradableFromId, upgradableFromId),
						eq(upgradableProducts.upgradableToId, upgradableToId),
					),
				}),
			)
		},
		async availableUpgradesForProduct(
			purchases: any,
			productId: string,
		): Promise<any[]> {
			const previousPurchaseProductIds = purchases.map(
				({ productId }: Purchase) => productId,
			)

			if (previousPurchaseProductIds.length > 0) {
				return client.query.upgradableProducts.findMany({
					where: and(
						eq(upgradableProducts.upgradableToId, productId),
						inArray(
							upgradableProducts.upgradableFromId,
							previousPurchaseProductIds,
						),
					),
				})
			}
			return []
		},
		clearLessonProgressForUser(options: {
			userId: string
			lessons: { id: string; slug: string }[]
		}): Promise<void> {
			throw new Error('clearLessonProgressForUser Method not implemented.')
		},
		async completeLessonProgressForUser(options: {
			userId: string
			lessonId?: string
		}): Promise<ResourceProgress | null> {
			if (!options.lessonId) {
				throw new Error('No lessonId provided')
			}

			let lessonProgress = await client.query.resourceProgress.findFirst({
				where: and(
					eq(resourceProgress.userId, options.userId),
					eq(resourceProgress.resourceId, options.lessonId),
				),
			})

			const now = new Date()

			if (lessonProgress) {
				if (!lessonProgress.completedAt) {
					await client
						.update(resourceProgress)
						.set({
							completedAt: now,
							updatedAt: now,
						})
						.where(eq(resourceProgress.resourceId, options.lessonId))
				}
			} else {
				await client.insert(resourceProgress).values({
					userId: options.userId,
					resourceId: options.lessonId,
					completedAt: now,
					updatedAt: now,
				})
			}
			lessonProgress = await client.query.resourceProgress.findFirst({
				where: and(
					eq(resourceProgress.userId, options.userId),
					eq(resourceProgress.resourceId, options.lessonId),
				),
			})
			const parsedLessonProgress =
				resourceProgressSchema.safeParse(lessonProgress)

			if (!parsedLessonProgress.success) {
				console.error('Error parsing lesson progress', lessonProgress)
				return null
			}

			return parsedLessonProgress.data
		},
		async couponForIdOrCode(options: {
			code?: string
			couponId?: string
		}): Promise<(Coupon & { merchantCoupon: MerchantCoupon }) | null> {
			if (!options.couponId && !options.code) return null
			const couponForIdOrCode = await client.query.coupon.findFirst({
				where: or(
					and(
						or(
							options.code ? eq(coupon.code, options.code) : undefined,
							options.couponId ? eq(coupon.id, options.couponId) : undefined,
						),
						gte(coupon.expires, new Date()),
					),
					and(
						or(
							options.code ? eq(coupon.code, options.code) : undefined,
							options.couponId ? eq(coupon.id, options.couponId) : undefined,
						),
						isNull(coupon.expires),
					),
				),
				with: {
					merchantCoupon: true,
				},
			})

			if (!couponForIdOrCode) return null

			const parsedCoupon = couponSchema
				.extend({
					merchantCoupon: merchantCouponSchema,
				})
				.safeParse(couponForIdOrCode)

			if (!parsedCoupon.success) {
				console.error(
					'Error parsing coupon',
					JSON.stringify(parsedCoupon.error),
				)
				return null
			}

			return parsedCoupon.data
		},
		async createMerchantSession(options): Promise<MerchantSession> {
			const id = `ms_${v4()}`
			await client.insert(merchantSession).values({
				id,
				identifier: options.identifier,
				merchantAccountId: options.merchantAccountId,
				...(options.organizationId
					? { organizationId: options.organizationId }
					: {}),
			})

			return MerchantSessionSchema.parse(
				await client.query.merchantSession.findFirst({
					where: eq(merchantSession.id, id),
				}),
			)
		},
		async createMerchantChargeAndPurchase(options): Promise<Purchase> {
			const purchaseId = await client.transaction(async (trx) => {
				try {
					const {
						userId,
						stripeChargeId,
						stripeCouponId,
						merchantAccountId,
						merchantProductId,
						merchantCustomerId,
						productId,
						stripeChargeAmount,
						quantity = 1,
						checkoutSessionId,
						appliedPPPStripeCouponId,
						upgradedFromPurchaseId,
						country,
						usedCouponId,
						organizationId,
					} = options

					const existingMerchantCharge = merchantChargeSchema.nullable().parse(
						(await client.query.merchantCharge.findFirst({
							where: eq(merchantCharge.identifier, stripeChargeId),
						})) || null,
					)

					const existingPurchaseForCharge = existingMerchantCharge
						? await client.query.purchases.findFirst({
								where: eq(
									purchaseTable.merchantChargeId,
									existingMerchantCharge.id,
								),
								with: {
									user: true,
									product: true,
									bulkCoupon: true,
								},
							})
						: null

					if (existingPurchaseForCharge) {
						return existingPurchaseForCharge.id
					}

					const merchantChargeId = `mc_${v4()}`
					const purchaseId = `purch_${v4()}`

					const newMerchantCharge = await client.insert(merchantCharge).values({
						id: merchantChargeId,
						userId,
						identifier: stripeChargeId,
						merchantAccountId,
						merchantProductId,
						merchantCustomerId,
					})

					const existingPurchase = purchaseSchema.nullable().parse(
						(await client.query.purchases.findFirst({
							where: and(
								eq(purchaseTable.productId, productId),
								eq(purchaseTable.userId, userId),
								inArray(purchaseTable.status, ['Valid', 'Restricted']),
							),
						})) || null,
					)

					const existingBulkCoupon = couponSchema.nullable().parse(
						await client
							.select()
							.from(coupon)
							.leftJoin(
								purchaseTable,
								and(
									eq(coupon.id, purchaseTable.bulkCouponId),
									eq(purchaseTable.userId, userId),
								),
							)
							.where(
								and(
									eq(coupon.restrictedToProductId, productId),
									eq(purchaseTable.userId, userId),
								),
							)
							.then((res) => {
								return res[0]?.Coupon ?? null
							}),
					)

					const isBulkPurchase =
						quantity > 1 ||
						Boolean(existingBulkCoupon) ||
						options.bulk ||
						Boolean(existingPurchase?.status === 'Valid')

					let bulkCouponId: string | null = null
					let couponToUpdate = null

					if (isBulkPurchase) {
						bulkCouponId =
							existingBulkCoupon !== null ? existingBulkCoupon.id : v4()

						if (existingBulkCoupon !== null) {
							couponToUpdate = await client
								.update(coupon)
								.set({
									maxUses: (existingBulkCoupon?.maxUses || 0) + quantity,
									...(organizationId ? { organizationId } : {}),
								})
								.where(eq(coupon.id, bulkCouponId))
						} else {
							// Try to find merchant coupon by stripeCouponId first
							let merchantCouponToUse = stripeCouponId
								? merchantCouponSchema.nullable().parse(
										(await client.query.merchantCoupon.findFirst({
											where: eq(merchantCoupon.identifier, stripeCouponId),
										})) || null,
									)
								: null

							// Fallback: If not found, try to find via usedCouponId from checkout session metadata
							if (!merchantCouponToUse && usedCouponId) {
								// First get the coupon record to find its merchantCouponId
								const usedCoupon = couponSchema.nullable().parse(
									(await client.query.coupon.findFirst({
										where: eq(coupon.id, usedCouponId),
									})) || null,
								)

								// Then get the merchant coupon
								if (usedCoupon?.merchantCouponId) {
									merchantCouponToUse = merchantCouponSchema.nullable().parse(
										(await client.query.merchantCoupon.findFirst({
											where: eq(merchantCoupon.id, usedCoupon.merchantCouponId),
										})) || null,
									)
								}
							}

							const bulkCouponValues = {
								id: bulkCouponId as string,
								percentageDiscount: '1.0',
								restrictedToProductId: productId,
								maxUses: quantity,
								status: 1,
								...(organizationId ? { organizationId } : {}),
								...(merchantCouponToUse
									? {
											merchantCouponId: merchantCouponToUse.id,
										}
									: {}),
							}

							couponToUpdate = await client
								.insert(coupon)
								.values(bulkCouponValues)
						}
					}

					// create a new merchant session
					const merchantSessionId = `ms_${v4()}`

					await client.insert(merchantSession).values({
						id: merchantSessionId,
						identifier: checkoutSessionId,
						merchantAccountId,
					})

					const merchantCouponUsed = stripeCouponId
						? await client.query.merchantCoupon.findFirst({
								where: eq(merchantCoupon.identifier, stripeCouponId),
							})
						: null

					const pppMerchantCoupon = appliedPPPStripeCouponId
						? await client.query.merchantCoupon.findFirst({
								where: and(
									eq(merchantCoupon.identifier, appliedPPPStripeCouponId),
									eq(merchantCoupon.type, 'ppp'),
								),
							})
						: null

					const newPurchaseStatus =
						merchantCouponUsed?.type === 'ppp' || pppMerchantCoupon
							? 'Restricted'
							: 'Valid'

					await client.insert(purchaseTable).values({
						id: purchaseId,
						status: newPurchaseStatus,
						userId,
						productId,
						merchantChargeId,
						totalAmount: (stripeChargeAmount / 100).toFixed(),
						bulkCouponId,
						merchantSessionId,
						country,
						upgradedFromId: upgradedFromPurchaseId || null,
						couponId: usedCouponId || null,
						...(organizationId ? { organizationId } : {}),
					})

					const oneWeekInMilliseconds = 1000 * 60 * 60 * 24 * 7

					await client.insert(purchaseUserTransfer).values({
						id: `put_${v4()}`,
						purchaseId: purchaseId as string,
						expiresAt: existingPurchase
							? new Date()
							: new Date(Date.now() + oneWeekInMilliseconds),
						sourceUserId: userId,
						...(organizationId ? { organizationId } : {}),
					})

					// const result = await Promise.all([
					// 	newMerchantCharge,
					// 	newPurchase,
					// 	newPurchaseUserTransfer,
					// 	newMerchantSession,
					// 	...(couponToUpdate ? [couponToUpdate] : []),
					// ])
					//
					// console.log('result', { result })

					return purchaseId
				} catch (error) {
					console.error(error)
					trx.rollback()
					throw error
				}
			})

			const parsedPurchase = purchaseSchema.safeParse(
				await client.query.purchases.findFirst({
					where: eq(purchaseTable.id, purchaseId as string),
				}),
			)

			if (!parsedPurchase.success) {
				console.error(
					'Error parsing purchase',
					parsedPurchase,
					JSON.stringify(parsedPurchase, null, 2),
				)
				throw new Error('Error parsing purchase')
			}

			return parsedPurchase.data
		},
		async findOrCreateMerchantCustomer(options: {
			user: User
			identifier: string
			merchantAccountId: string
		}): Promise<MerchantCustomer | null> {
			const merchantCustomer = merchantCustomerSchema
				.nullable()
				.optional()
				.parse(
					await client.query.merchantCustomer.findFirst({
						where: (merchantCustomer, { eq }) =>
							eq(merchantCustomer.identifier, options.identifier),
					}),
				)

			if (merchantCustomer) {
				return merchantCustomer
			}

			return await adapter.createMerchantCustomer({
				identifier: options.identifier,
				merchantAccountId: options.merchantAccountId,
				userId: options.user.id,
			})
		},
		async createMerchantEvent(options: {
			merchantAccountId: string
			identifier: string
			payload: Record<string, any>
		}): Promise<MerchantEvents> {
			const eventId = `me_${v4()}`

			await client.insert(merchantEvents).values({
				id: eventId,
				merchantAccountId: options.merchantAccountId,
				identifier: options.identifier,
				payload: options.payload,
			})

			const createdEvent = await client.query.merchantEvents.findFirst({
				where: eq(merchantEvents.id, eventId),
			})

			return merchantEventsSchema.parse(createdEvent)
		},
		async getMerchantEventByIdentifier(
			identifier: string,
		): Promise<MerchantEvents | null> {
			const event = await client.query.merchantEvents.findFirst({
				where: eq(merchantEvents.identifier, identifier),
			})

			return event ? merchantEventsSchema.parse(event) : null
		},
		async getMerchantEventsByAccount(
			merchantAccountId: string,
		): Promise<MerchantEvents[]> {
			const events = await client.query.merchantEvents.findMany({
				where: eq(merchantEvents.merchantAccountId, merchantAccountId),
				orderBy: [desc(merchantEvents.createdAt)],
			})

			return events.map((event) => merchantEventsSchema.parse(event))
		},
		async findOrCreateUser(
			email: string,
			name?: string | null,
		): Promise<{
			user: User
			isNewUser: boolean
		}> {
			const user = await adapter.getUserByEmail?.(email)

			if (!user) {
				const newUser = await adapter.createUser?.({
					id: `u_${v4()}`,
					email,
					name,
					emailVerified: null,
				})
				console.log('newUser', { newUser })
				if (!newUser) {
					throw new Error('Could not create user')
				}
				return {
					user: newUser as User,
					isNewUser: true,
				}
			}

			return {
				user: user as User,
				isNewUser: false,
			}
		},
		async getCoupon(couponIdOrCode: string): Promise<Coupon | null> {
			const loadedCoupon =
				(await client.query.coupon.findFirst({
					where: or(
						eq(coupon.id, couponIdOrCode),
						eq(coupon.code, couponIdOrCode),
					),
				})) || null

			logger.debug('loadedCoupon', { loadedCoupon })

			return couponSchema.nullable().parse(loadedCoupon)
		},
		async getPurchasesForBulkCouponId(
			bulkCouponId: string,
		): Promise<(Purchase & { user: User })[]> {
			return z.array(purchaseSchema.extend({ user: userSchema })).parse(
				await client.query.purchases.findMany({
					where: eq(purchaseTable.bulkCouponId, bulkCouponId),
					with: {
						user: true,
					},
				}),
			)
		},
		async getCouponWithBulkPurchases(couponId: string): Promise<
			| (Coupon & {
					bulkPurchases?: Purchase[] | null
					redeemedBulkCouponPurchases: { bulkCouponId?: string | null }[]
			  })
			| null
		> {
			logger.debug('getCouponWithBulkPurchases', { couponId })
			let couponData
			let bulkCouponPurchases
			try {
				couponData =
					(await client.query.coupon.findFirst({
						where: eq(coupon.id, couponId),
						with: {
							bulkPurchases: true,
							redeemedBulkCouponPurchases: true,
						},
					})) || null
			} catch (e) {
				console.log('getCouponWithBulkPurchases')
				logger.error(e as Error)
			}

			try {
				bulkCouponPurchases = await client.query.purchases.findMany({
					where: eq(purchaseTable.redeemedBulkCouponId, couponId),
					with: {
						user: true,
					},
				})
				console.log('purchases with redeemedBulkCouponId', bulkCouponPurchases)
			} catch (e) {
				console.log('getCouponWithBulkPurchases')
				logger.error(e as Error)
			}

			if (!couponData) {
				logger.debug('getCouponWithBulkPurchases', {
					couponId,
					error: 'no coupon found',
				})
				return null
			}

			const couponWithBulkPurchases = {
				...couponData,
				redeemedBulkCouponPurchases: bulkCouponPurchases || [],
			}

			const parsedCoupon = couponSchema
				.merge(
					z.object({
						redeemedBulkCouponPurchases: z.array(purchaseSchema),
					}),
				)
				.nullable()
				.safeParse(couponWithBulkPurchases)

			if (!parsedCoupon.success) {
				console.error(
					'Error parsing coupon',
					JSON.stringify(parsedCoupon.error),
					couponData,
				)
				return null
			}

			return parsedCoupon.data
		},
		async getDefaultCoupon(productIds?: string[]): Promise<{
			defaultMerchantCoupon: MerchantCoupon
			defaultCoupon: Coupon
		} | null> {
			const activeSaleCoupon = await client.query.coupon.findFirst({
				where: and(
					eq(coupon.status, 1),
					eq(coupon.default, true),
					gte(coupon.expires, new Date()),
					or(
						productIds
							? inArray(coupon.restrictedToProductId, productIds)
							: undefined,
						isNull(coupon.restrictedToProductId),
					),
				),
				orderBy: desc(coupon.percentageDiscount),
				with: {
					merchantCoupon: true,
					product: true,
				},
			})
			if (activeSaleCoupon) {
				const { restrictedToProductId } = activeSaleCoupon
				const validForProdcutId = restrictedToProductId
					? productIds?.includes(restrictedToProductId as string)
					: true

				const { merchantCoupon: defaultMerchantCoupon, ...defaultCoupon } =
					activeSaleCoupon

				if (validForProdcutId) {
					return {
						defaultMerchantCoupon: merchantCouponSchema.parse(
							defaultMerchantCoupon,
						),
						defaultCoupon: couponSchema.parse(defaultCoupon),
					}
				}
			}
			return null
		},
		getLessonProgressCountsByDate(): Promise<
			{
				count: number
				completedAt: string
			}[]
		> {
			throw new Error('getLessonProgressCountsByDate Method not implemented.')
		},
		async getLessonProgressForUser(
			userId: string,
		): Promise<ResourceProgress[]> {
			const userProgress = await client.query.resourceProgress.findMany({
				where: eq(resourceProgress.userId, userId),
			})
			const parsed = z.array(resourceProgressSchema).safeParse(userProgress)
			if (!parsed.success) {
				console.error('Error parsing user progress', userProgress)
				return []
			}
			return parsed.data
		},
		async getModuleProgressForUser(
			userIdOrEmail: string,
			moduleIdOrSlug: string,
		): Promise<ModuleProgress | null> {
			// First, get the user ID
			const user = await client.query.users.findFirst({
				where: or(eq(users.id, userIdOrEmail), eq(users.email, userIdOrEmail)),
				columns: {
					id: true,
				},
			})

			if (!user) {
				return null
			}

			const ResultRowSchema = z.object({
				resource_id: z.string(),
				resource_type: z.enum(['lesson', 'exercise', 'post']),
				resource_slug: z.string().nullable(),
				completed_at: z
					.string()
					.nullable()
					.transform((val) => (val ? new Date(val) : null)),
			})

			// Execute the optimized query - create a flattened, properly ordered list
			const results: any = await client.execute(sql`
				WITH RECURSIVE workshop AS (
					SELECT id, fields->>'$.slug' AS slug
					FROM ${contentResource}
					WHERE id = ${moduleIdOrSlug} OR fields->>'$.slug' = ${moduleIdOrSlug}
				),
				-- Get all workshop resources with their positions
				workshop_structure AS (
					SELECT
						w.id AS workshop_id,
						crr.resourceId,
						crr.position AS position,
						cr.type AS resource_type,
						cr.fields->>'$.slug' AS resource_slug,
						cr.id AS resource_content_id
					FROM workshop w
					JOIN ${contentResourceResource} crr ON w.id = crr.resourceOfId
					JOIN ${contentResource} cr ON crr.resourceId = cr.id
					ORDER BY crr.position
				),
				-- Recursively expand sections and maintain global ordering
				expanded_resources AS (
					-- Base case: direct lessons/posts from workshop
					SELECT
						workshop_id,
						position * 1000 AS global_order, -- Multiply by 1000 to leave room for section items
						resource_content_id AS resource_id,
						resource_type,
						resource_slug
					FROM workshop_structure
					WHERE resource_type IN ('lesson', 'post')
					UNION ALL
					-- Recursive case: lessons within sections
					SELECT
						ws.workshop_id,
						ws.position * 1000 + crr.position AS global_order, -- Section position * 1000 + lesson position
						cr.id AS resource_id,
						cr.type AS resource_type,
						cr.fields->>'$.slug' AS resource_slug
					FROM workshop_structure ws
					JOIN ${contentResourceResource} crr ON ws.resource_content_id = crr.resourceOfId
					JOIN ${contentResource} cr ON crr.resourceId = cr.id
					WHERE ws.resource_type = 'section'
					AND cr.type IN ('lesson', 'post')
				)
				SELECT
					er.resource_id,
					er.resource_type,
					er.resource_slug,
					rp.completedAt AS completed_at,
					er.global_order
				FROM expanded_resources er
				LEFT JOIN ${resourceProgress} rp ON rp.resourceId = er.resource_id
					AND rp.userId = ${user.id}
				ORDER BY er.global_order ASC
			`)
			// Process the results
			const completedLessons: ResourceProgress[] = []
			let nextResource: Partial<ContentResource> | null = null
			let completedLessonsCount = 0
			let totalLessonsCount = results.rows.length

			const parsedRows = z.array(ResultRowSchema).safeParse(results.rows)

			if (!parsedRows.success) {
				console.error('Error parsing rows', parsedRows.error)
				return {
					completedLessons: [],
					nextResource: null,
					percentCompleted: 0,
					completedLessonsCount: 0,
					totalLessonsCount,
				}
			}

			for (const row of parsedRows.data) {
				if (row.completed_at) {
					completedLessonsCount++
					completedLessons.push({
						userId: user.id as string,
						resourceId: row.resource_id,
						completedAt: new Date(row.completed_at),
						// Add other fields as needed
					})
				} else if (!nextResource) {
					nextResource = {
						id: row.resource_id,
						type: row.resource_type,
						fields: {
							slug: row.resource_slug,
						},
					}
				}
			}

			const percentCompleted =
				totalLessonsCount > 0
					? Math.ceil((completedLessonsCount / totalLessonsCount) * 100)
					: 0

			return {
				completedLessons,
				nextResource,
				percentCompleted,
				completedLessonsCount,
				totalLessonsCount,
			}
		},
		getLessonProgresses(): Promise<ResourceProgress[]> {
			throw new Error('getLessonProgresses Method not implemented.')
		},
		async getMerchantCharge(
			merchantChargeId: string,
		): Promise<MerchantCharge | null> {
			const mCharge = await client.query.merchantCharge.findFirst({
				where: eq(merchantCharge.id, merchantChargeId),
			})
			const parsed = merchantChargeSchema.safeParse(mCharge)
			if (!parsed.success) {
				console.info('Error parsing merchantCharge', mCharge)
				return null
			}
			return parsed.data
		},
		async getMerchantCouponsForTypeAndPercent(params: {
			type: string
			percentageDiscount: number
		}): Promise<MerchantCoupon[]> {
			return z.array(merchantCouponSchema).parse(
				await client.query.merchantCoupon.findMany({
					where: and(
						eq(merchantCoupon.type, params.type),
						eq(
							merchantCoupon.percentageDiscount,
							params.percentageDiscount.toString(),
						),
					),
				}),
			)
		},
		async getMerchantCouponForTypeAndPercent(params: {
			type: string
			percentageDiscount: number
		}): Promise<MerchantCoupon | null> {
			const foundMerchantCoupon = await client.query.merchantCoupon.findFirst({
				where: and(
					eq(merchantCoupon.type, params.type),
					eq(
						merchantCoupon.percentageDiscount,
						params.percentageDiscount.toString(),
					),
				),
			})

			const parsed = merchantCouponSchema
				.nullable()
				.safeParse(foundMerchantCoupon)
			if (parsed.success) {
				return parsed.data
			}

			return null
		},
		async getMerchantCouponForTypeAndAmount(params: {
			type: string
			amountDiscount: number
		}): Promise<MerchantCoupon | null> {
			const foundMerchantCoupon = await client.query.merchantCoupon.findFirst({
				where: and(
					eq(merchantCoupon.type, params.type),
					eq(merchantCoupon.amountDiscount, params.amountDiscount),
				),
			})

			const parsed = merchantCouponSchema
				.nullable()
				.safeParse(foundMerchantCoupon)
			if (parsed.success) {
				return parsed.data
			}

			return null
		},
		async getMerchantCoupon(
			merchantCouponId: string,
		): Promise<MerchantCoupon | null> {
			const foundMerchantCoupon = await client.query.merchantCoupon.findFirst({
				where: eq(merchantCoupon.id, merchantCouponId),
			})

			const parsed = merchantCouponSchema
				.nullable()
				.safeParse(foundMerchantCoupon)
			if (parsed.success) {
				return parsed.data
			}

			return null
		},
		async getMerchantProduct(
			stripeProductId: string,
		): Promise<MerchantProduct | null> {
			return merchantProductSchema.nullable().parse(
				await client.query.merchantProduct.findFirst({
					where: eq(merchantProduct.identifier, stripeProductId),
				}),
			)
		},
		getPrice(productId: string): Promise<Price | null> {
			throw new Error('getPrice  not implemented.')
		},
		async getPriceForProduct(productId: string): Promise<Price | null> {
			return priceSchema.nullable().parse(
				await client.query.prices.findFirst({
					where: eq(prices.productId, productId),
				}),
			)
		},
		async archiveProduct(productId) {
			if (!paymentProvider) throw new Error('Payment provider not found')
			const product = await adapter.getProduct(productId)

			if (!product) {
				throw new Error(`Product not found for id (${productId})`)
			}

			if (!product.price) {
				throw new Error(`Product has no price`)
			}

			await client
				.update(products)
				.set({ status: 0, name: `${product.name} (Archived)` })
				.where(eq(products.id, productId))

			await client
				.update(prices)
				.set({ status: 0, nickname: `${product.name} (Archived)` })
				.where(eq(prices.productId, productId))

			await client
				.update(merchantProduct)
				.set({ status: 0 })
				.where(eq(merchantProduct.productId, productId))

			await client
				.update(merchantPrice)
				.set({ status: 0 })
				.where(eq(merchantPrice.priceId, product.price.id))

			const currentMerchantProduct = merchantProductSchema.nullish().parse(
				await client.query.merchantProduct.findFirst({
					where: eq(merchantProduct.productId, productId),
				}),
			)

			if (!currentMerchantProduct || !currentMerchantProduct.identifier) {
				throw new Error(`Merchant product not found for id (${productId})`)
			}

			await paymentProvider.updateProduct(currentMerchantProduct.identifier, {
				active: false,
			})

			const currentMerchantPrice = merchantPriceSchema.nullish().parse(
				await client.query.merchantPrice.findFirst({
					where: and(
						eq(merchantPrice.priceId, product.price.id),
						eq(merchantPrice.status, 1),
					),
				}),
			)

			if (!currentMerchantPrice || !currentMerchantPrice.identifier) {
				throw new Error(`Merchant price not found for id (${productId})`)
			}

			await paymentProvider.updatePrice(currentMerchantPrice.identifier, {
				active: false,
			})

			return adapter.getProduct(productId)
		},
		async updateProduct(input: Product) {
			if (!paymentProvider) throw new Error('Payment provider not found')
			const currentProduct = await adapter.getProduct(input.id)
			if (!currentProduct) {
				throw new Error(`Product not found`)
			}
			if (!currentProduct.price) {
				throw new Error(`Product has no price`)
			}

			const merchantProduct = merchantProductSchema.nullish().parse(
				await client.query.merchantProduct.findFirst({
					where: (merchantProduct, { eq }) =>
						eq(merchantProduct.productId, input.id),
				}),
			)

			if (!merchantProduct || !merchantProduct.identifier) {
				throw new Error(`Merchant product not found`)
			}

			// TODO: handle upgrades

			const stripeProduct = await paymentProvider.getProduct(
				merchantProduct.identifier,
			)

			const priceChanged =
				currentProduct.price.unitAmount.toString() !==
				input.price?.unitAmount.toString()

			if (priceChanged) {
				const currentMerchantPrice = merchantPriceSchema.nullish().parse(
					await client.query.merchantPrice.findFirst({
						where: (merchantPrice, { eq, and }) =>
							and(
								eq(merchantPrice.merchantProductId, merchantProduct.id),
								eq(merchantPrice.status, 1),
							),
					}),
				)

				if (!currentMerchantPrice || !currentMerchantPrice.identifier) {
					throw new Error(`Merchant price not found`)
				}

				const currentStripePrice = await paymentProvider.getPrice(
					currentMerchantPrice.identifier,
				)

				const newStripePrice = await paymentProvider.createPrice({
					product: stripeProduct.id,
					unit_amount: Math.floor(Number(input.price?.unitAmount || 0) * 100),
					currency: 'usd',
					metadata: {
						slug: input.fields.slug,
					},
					active: true,
				})

				await paymentProvider.updateProduct(stripeProduct.id, {
					default_price: newStripePrice.id,
				})

				const newMerchantPriceId = `mprice_${v4()}`
				await client.insert(merchantPrice).values({
					id: newMerchantPriceId,
					merchantProductId: merchantProduct.id,
					merchantAccountId: merchantProduct.merchantAccountId,
					priceId: currentProduct.price.id,
					status: 1,
					identifier: newStripePrice.id,
				})

				if (currentMerchantPrice) {
					await client
						.update(merchantPrice)
						.set({
							status: 0,
						})
						.where(eq(merchantPrice.id, currentMerchantPrice.id))
				}

				await client
					.update(prices)
					.set({
						unitAmount: Math.floor(
							Number(input.price?.unitAmount || 0),
						).toString(),
						nickname: input.name,
					})
					.where(eq(prices.id, currentProduct.price.id))

				if (currentStripePrice) {
					await paymentProvider.updatePrice(currentStripePrice.id, {
						active: false,
					})
				}
			}

			await paymentProvider.updateProduct(stripeProduct.id, {
				name: input.name,
				active: true,
				images: input.fields.image?.url ? [input.fields.image.url] : undefined,
				description: input.fields.description || '',
				metadata: {
					slug: input.fields.slug,
				},
			})

			const { image, ...fieldsNoImage } = input.fields

			await client
				.update(products)
				.set({
					name: input.name,
					quantityAvailable: input.quantityAvailable,
					status: 1,
					fields: {
						...fieldsNoImage,
						...(image?.url && { image }),
					},
					type: input.type,
				})
				.where(eq(products.id, currentProduct.id))

			return adapter.getProduct(currentProduct.id)
		},
		async createProduct(input: NewProduct) {
			if (!paymentProvider) throw new Error('Payment provider not found')
			const merchantAccount = merchantAccountSchema.nullish().parse(
				await client.query.merchantAccount.findFirst({
					where: (merchantAccount, { eq }) =>
						eq(merchantAccount.label, 'stripe'),
				}),
			)

			if (!merchantAccount) {
				throw new Error('Merchant account not found')
			}

			const hash = guid()
			const newProductId = slugify(`product-${hash}`)

			const newProduct = {
				id: newProductId,
				name: input.name,
				status: 1,
				type: input.type || 'self-paced',
				quantityAvailable: input.quantityAvailable,
				fields: {
					state: input.state || 'draft',
					visibility: input.visibility || 'unlisted',
					slug: slugify(`${input.name}-${hash}`),
					...(input.openEnrollment && { openEnrollment: input.openEnrollment }),
					...(input.closeEnrollment && {
						closeEnrollment: input.closeEnrollment,
					}),
				},
			}

			await client.insert(products).values(newProduct)

			const priceHash = guid()
			const newPriceId = `price-${priceHash}`

			await client.insert(prices).values({
				id: newPriceId,
				productId: newProductId,
				unitAmount: input.price.toString(),
				status: 1,
			})

			const product = await adapter.getProduct(newProductId)

			const stripeProduct = await paymentProvider.createProduct({
				name: input.name,
				metadata: {
					slug: product?.fields?.slug || null,
				},
			})

			const stripePrice = await paymentProvider.createPrice({
				product: stripeProduct.id,
				unit_amount: Math.floor(Number(input.price) * 100),
				currency: 'usd',
				nickname: input.name,
				metadata: {
					slug: product?.fields?.slug || null,
				},
			})

			const newMerchantProductId = `mproduct_${v4()}`

			await client.insert(merchantProduct).values({
				id: newMerchantProductId,
				merchantAccountId: merchantAccount.id,
				productId: newProductId,
				identifier: stripeProduct.id,
				status: 1,
			})

			const newMerchantPriceId = `mprice_${v4()}`
			await client.insert(merchantPrice).values({
				id: newMerchantPriceId,
				merchantAccountId: merchantAccount.id,
				merchantProductId: newMerchantProductId,
				priceId: newPriceId,
				identifier: stripePrice.id,
				status: 1,
			})

			// TODO: handle upgrades

			return product
		},
		async getProduct(
			productSlugOrId?: string,
			withResources: boolean = true,
		): Promise<Product | null> {
			if (!productSlugOrId) {
				return null
			}

			try {
				const productData = await client.query.products.findFirst({
					where: and(
						or(
							eq(
								sql`JSON_EXTRACT (${products.fields}, "$.slug")`,
								`${productSlugOrId}`,
							),
							eq(products.id, productSlugOrId),
						),
					),
					with: {
						price: true,
						...(withResources && {
							resources: {
								with: {
									resource: {
										with: {
											resources: true,
										},
									},
								},
							},
						}),
					},
				})
				const parsedProduct = productSchema.safeParse(productData)
				if (!parsedProduct.success) {
					console.error(
						'Error parsing product',
						JSON.stringify(parsedProduct.error),
						JSON.stringify(productData),
					)
					return null
				}
				return parsedProduct.data
			} catch (e) {
				console.log('getProduct error', e)
				return null
			}
		},
		async getProductResources(
			productId: string,
		): Promise<ContentResource[] | null> {
			const contentResourceProductsForProduct = z
				.array(ContentResourceProductSchema)
				.nullable()
				.parse(
					await client.query.contentResourceProduct.findMany({
						where: eq(contentResourceProduct.productId, productId),
					}),
				)

			if (!contentResourceProductsForProduct) {
				return null
			} else {
				const contentResources = z.array(ContentResourceSchema).parse(
					await client.query.contentResource.findMany({
						where: inArray(
							contentResource.id,
							contentResourceProductsForProduct.map((crp) => crp.resourceId),
						),
					}),
				)
				return contentResources
			}
		},
		async getPurchaseCountForProduct(productId: string): Promise<number> {
			return await client.query.purchases
				.findMany({
					where: and(
						eq(purchaseTable.productId, productId),
						inArray(purchaseTable.status, ['Valid', 'Restricted']),
					),
				})
				.then((res) => res.length)
		},
		async getPurchase(purchaseId: string): Promise<Purchase | null> {
			const purchase = await client.query.purchases.findFirst({
				where: eq(purchaseTable.id, purchaseId),
			})

			return purchase ? purchaseSchema.parse(purchase) : null
		},
		async createPurchase(options): Promise<Purchase> {
			const newPurchaseId = options.id || `purchase-${v4()}`
			await client.insert(purchaseTable).values({
				...options,
				id: newPurchaseId,
			})

			const newPurchase = await adapter.getPurchase(newPurchaseId)

			return purchaseSchema.parse(newPurchase)
		},

		async getPurchaseForStripeCharge(
			stripeChargeId: string,
		): Promise<Purchase | null> {
			logger.debug('getPurchaseForStripeCharge', { stripeChargeId })

			const chargeForPurchase = merchantChargeSchema.nullable().parse(
				(await client.query.merchantCharge.findFirst({
					where: eq(merchantCharge.identifier, stripeChargeId),
				})) || null,
			)

			if (!chargeForPurchase) {
				logger.error(
					new Error(
						`No charge found for purchase: Stripe Charge ID: ${stripeChargeId}`,
					),
				)
				return null
			}

			const purchase = purchaseSchema.safeParse(
				await client.query.purchases.findFirst({
					where: eq(purchaseTable.merchantChargeId, chargeForPurchase.id),
					with: {
						user: true,
						product: true,
						bulkCoupon: true,
					},
				}),
			)

			if (!purchase.success) {
				return null
			}

			return purchase.data
		},
		async getPurchaseUserTransferById(options: { id: string }): Promise<
			| (PurchaseUserTransfer & {
					sourceUser: User
					targetUser: User | null
					purchase: Purchase
			  })
			| null
		> {
			const purchaseTransferData =
				await client.query.purchaseUserTransfer.findFirst({
					where: eq(purchaseUserTransfer.id, options.id),
					with: {
						sourceUser: true,
						targetUser: true,
						purchase: true,
					},
				})

			return purchaseUserTransferSchema
				.merge(
					z.object({
						sourceUser: userSchema,
						targetUser: userSchema.nullable(),
						purchase: purchaseSchema,
						organizationId: z.string().nullable(),
					}),
				)
				.nullable()
				.parse(purchaseTransferData)
		},
		async getPurchaseWithUser(purchaseId: string): Promise<
			| (Purchase & {
					user: User
			  })
			| null
		> {
			const purchaseData =
				(await client.query.purchases.findFirst({
					where: eq(purchaseTable.id, purchaseId),
					with: {
						user: true,
					},
				})) || null

			const parsedPurchase = purchaseSchema
				.merge(z.object({ user: userSchema }))
				.nullable()
				.safeParse(purchaseData)

			if (!parsedPurchase.success) {
				console.error('Error parsing purchase', parsedPurchase.error)
				return null
			}
			return parsedPurchase.data
		},
		async getPurchasesForUser(userId?: string): Promise<Purchase[]> {
			if (!userId) {
				return []
			}

			const visiblePurchaseStates = ['Valid', 'Refunded', 'Restricted']

			const userPurchases = await client.query.purchases.findMany({
				where: and(
					eq(purchaseTable.userId, userId),
					inArray(purchaseTable.status, visiblePurchaseStates),
				),
				with: {
					user: true,
					product: true,
					bulkCoupon: true,
				},
				orderBy: asc(purchaseTable.createdAt),
			})

			const parsedPurchases = z.array(purchaseSchema).safeParse(userPurchases)

			if (!parsedPurchases.success) {
				console.error(
					'Error parsing purchases',
					JSON.stringify(parsedPurchases.error),
				)
				return []
			}

			return parsedPurchases.data
		},
		async getEntitlementsForUser(params: {
			userId: string
			sourceType?: string
			entitlementType?: string
		}): Promise<Entitlement[]> {
			const { userId, sourceType, entitlementType } = params

			if (!userId) {
				return []
			}

			const conditions = [eq(entitlementTable.userId, userId)]

			if (sourceType) {
				conditions.push(eq(entitlementTable.sourceType, sourceType))
			}

			if (entitlementType) {
				conditions.push(eq(entitlementTable.entitlementType, entitlementType))
			}

			// Only return active entitlements (not deleted, not expired)
			conditions.push(isNull(entitlementTable.deletedAt))
			const expiresCondition = or(
				isNull(entitlementTable.expiresAt),
				gte(entitlementTable.expiresAt, sql`CURRENT_TIMESTAMP`),
			)
			if (expiresCondition) {
				conditions.push(expiresCondition)
			}

			const userEntitlements = await client.query.entitlements.findMany({
				where: conditions.length > 0 ? and(...conditions) : undefined,
				orderBy: asc(entitlementTable.createdAt),
			})

			const parsedEntitlements = z
				.array(entitlementSchema)
				.safeParse(userEntitlements)

			if (!parsedEntitlements.success) {
				console.error(
					'[getEntitlementsForUser] Error parsing entitlements',
					JSON.stringify(parsedEntitlements.error),
				)
				return []
			}

			return parsedEntitlements.data
		},
		async getEntitlementTypeByName(
			name: string,
		): Promise<{ id: string; name: string } | null> {
			const entitlementType = await client.query.entitlementTypes.findFirst({
				where: eq(entitlementTypes.name, name),
			})

			if (!entitlementType) {
				return null
			}

			return {
				id: String(entitlementType.id),
				name: String(entitlementType.name),
			}
		},
		async getPurchaseDetails(
			purchaseId: string,
			userId: string,
		): Promise<{
			purchase?: Purchase
			existingPurchase?: Purchase | null
			availableUpgrades: UpgradableProduct[]
		}> {
			const visiblePurchaseStates = ['Valid', 'Refunded', 'Restricted']

			const userPurchases = await client.query.purchases.findMany({
				where: and(
					eq(purchaseTable.userId, userId),
					inArray(purchaseTable.status, visiblePurchaseStates),
				),
				with: {
					user: true,
					product: true,
					bulkCoupon: true,
				},
				orderBy: asc(purchaseTable.createdAt),
			})

			const parsedPurchases = z.array(purchaseSchema).safeParse(userPurchases)

			const allPurchases = parsedPurchases.success ? parsedPurchases.data : []

			const thePurchase = await client.query.purchases.findFirst({
				where: and(
					eq(purchaseTable.id, purchaseId),
					eq(purchaseTable.userId, userId),
				),
				with: {
					user: true,
					product: true,
					bulkCoupon: true,
				},
			})

			const parsedPurchase = purchaseSchema.safeParse(thePurchase)

			if (!parsedPurchase.success) {
				console.error('Error parsing purchase', parsedPurchase)
				return {
					availableUpgrades: [],
				}
			}

			const purchaseCanUpgrade = ['Valid', 'Restricted'].includes(
				parsedPurchase.data.state || '',
			)

			let availableUpgrades: any[] = []

			if (purchaseCanUpgrade) {
				availableUpgrades = await client.query.upgradableProducts.findMany({
					where: and(
						eq(
							upgradableProducts.upgradableFromId,
							parsedPurchase.data.product?.id as string,
						),
						not(
							inArray(
								upgradableProducts.upgradableToId,
								allPurchases.map((p) => p.product?.id as string),
							),
						),
					),
					with: {
						upgradableTo: true,
						upgradableFrom: true,
					},
				})
			}

			const existingPurchase = purchaseSchema
				.optional()
				.nullable()
				.parse(
					(await client.query.purchases.findFirst({
						where: and(
							eq(purchaseTable.userId, userId),
							eq(purchaseTable.productId, parsedPurchase.data.productId),
							inArray(purchaseTable.status, ['Valid', 'Restricted']),
							isNull(purchaseTable.bulkCouponId),
							not(eq(purchaseTable.id, parsedPurchase.data.id)),
						),
						with: {
							user: true,
							product: true,
							bulkCoupon: true,
						},
					})) || null,
				)

			return {
				availableUpgrades: z
					.array(upgradableProductSchema)
					.parse(availableUpgrades),
				existingPurchase,
				purchase: parsedPurchase.data,
			}
		},
		async getUserWithPurchasersByEmail(email: string): Promise<any | null> {
			const user = await client.query.users.findFirst({
				where: eq(users.email, email.trim().toLowerCase()),
				with: {
					// merchantCustomer: true,
					roles: {
						with: {
							role: true,
						},
					},
					purchases: {
						with: {
							bulkCoupon: true,
							merchantCharge: true,
							product: {
								columns: {
									id: true,
									name: true,
									key: true,
								},
							},
						},
					},
				},
			})

			return user
		},
		async getUserById(userId: string): Promise<User | null> {
			const user = await client.query.users
				.findFirst({
					where: eq(users.id, userId),
					with: {
						roles: {
							with: {
								role: true,
							},
						},
					},
				})
				.then(async (res) => {
					if (res) {
						return {
							...res,
							roles: res.roles.map((r) => r.role),
						}
					}
				})

			return userSchema.nullable().parse(user ?? null)
		},
		async pricesOfPurchasesTowardOneBundle({
			userId,
			bundleId,
		}: {
			userId: string | undefined
			bundleId: string
		}): Promise<Price[]> {
			if (userId === undefined) return []

			const canUpgradeProducts = await client.query.upgradableProducts.findMany(
				{
					where: eq(upgradableProducts.upgradableToId, bundleId),
				},
			)

			const upgradableFrom = z.array(z.string()).parse(
				canUpgradeProducts.map((product) => {
					return product.upgradableFromId
				}),
			)

			const purchases = await client.query.purchases.findMany({
				where: and(
					eq(purchaseTable.userId, userId),
					inArray(purchaseTable.productId, upgradableFrom),
				),
			})

			const productsPurchased = z.array(z.string()).parse(
				purchases.map((purchase) => {
					return purchase.productId
				}),
			)

			if (productsPurchased.length === 0) return []

			const foundPrices = await client.query.prices.findMany({
				where: inArray(prices.productId, productsPurchased),
			})

			return z.array(priceSchema).parse(foundPrices)
		},
		async toggleLessonProgressForUser(options: {
			userId: string
			lessonId?: string
		}): Promise<ResourceProgress | null> {
			if (!options.lessonId) {
				throw new Error('No lessonId provided')
			}

			let lessonProgress = await client.query.resourceProgress.findFirst({
				where: and(
					eq(resourceProgress.userId, options.userId),
					eq(resourceProgress.resourceId, options.lessonId),
				),
			})

			const now = new Date()

			if (lessonProgress) {
				await client
					.update(resourceProgress)
					.set({
						completedAt: lessonProgress.completedAt ? null : now,
						updatedAt: now,
					})
					.where(eq(resourceProgress.resourceId, options.lessonId))
			} else {
				await client.insert(resourceProgress).values({
					userId: options.userId,
					resourceId: options.lessonId,
					completedAt: now,
					updatedAt: now,
				})
			}

			lessonProgress = await client.query.resourceProgress.findFirst({
				where: and(
					eq(resourceProgress.userId, options.userId),
					eq(resourceProgress.resourceId, options.lessonId),
				),
			})

			const parsedLessonProgress =
				resourceProgressSchema.safeParse(lessonProgress)

			if (!parsedLessonProgress.success) {
				console.error('Error parsing lesson progress', lessonProgress)
				return null
			}

			return parsedLessonProgress.data
		},
		transferPurchaseToUser: async (options: {
			purchaseId: string
			targetUserId: string
			sourceUserId: string
		}) => {
			const { purchaseId, targetUserId, sourceUserId } = options
			const transferId = `put_${v4()}`
			let purchase = await adapter.getPurchase(purchaseId)
			if (!purchase) throw new Error('No purchase found')

			if (purchase.userId !== sourceUserId)
				throw new Error('Invalid source user')

			await client.transaction(async (trx) => {
				if (!purchase) throw new Error('No purchase found')
				await trx
					.update(purchaseTable)
					.set({ userId: targetUserId })
					.where(eq(purchaseTable.id, purchase.id))

				await trx.insert(purchaseUserTransfer).values({
					id: transferId,
					purchaseId: purchase.id,
					sourceUserId: sourceUserId,
					targetUserId: targetUserId,
					transferState: 'COMPLETED',
					completedAt: new Date(),
				})

				purchase = await adapter.getPurchase(purchaseId)

				if (!purchase) throw new Error('No purchase found')

				if (paymentProvider && purchase.merchantChargeId) {
					await trx
						.update(merchantCharge)
						.set({
							userId: targetUserId,
						})
						.where(eq(merchantCharge.id, purchase.merchantChargeId))

					const updatedMerchantCharge = await adapter.getMerchantCharge(
						purchase.merchantChargeId,
					)

					if (!updatedMerchantCharge)
						throw new Error('No merchant charge found')

					await trx
						.update(merchantCustomer)
						.set({ userId: targetUserId })
						.where(
							eq(merchantCustomer.id, updatedMerchantCharge.merchantCustomerId),
						)

					const updatedMerchantCustomer = merchantCustomerSchema.parse(
						await client.query.merchantCustomer.findFirst({
							where: eq(
								merchantCustomer.id,
								updatedMerchantCharge.merchantCustomerId,
							),
						}),
					)

					const targetUser = userSchema.parse(
						await client.query.users.findFirst({
							where: eq(users.id, targetUserId),
						}),
					)

					const sourceUser = userSchema.parse(
						await client.query.users.findFirst({
							where: eq(users.id, sourceUserId),
						}),
					)

					await paymentProvider.updateCustomer(
						updatedMerchantCustomer.identifier,
						{
							email: targetUser.email,
							name: targetUser.name || sourceUser.name || '',
							metadata: {
								transferId,
								transferredFrom: sourceUser.email,
								transferredOn: new Date().toISOString(),
							},
						},
					)
				}
			})
			return await adapter.getPurchaseUserTransferById({
				id: transferId,
			})
		},
		transferPurchasesToNewUser(options: {
			merchantCustomerId: string
			userId: string
		}): Promise<unknown> {
			throw new Error('Method not implemented.')
		},
		async updatePurchaseStatusForCharge(
			chargeId: string,
			status: 'Valid' | 'Refunded' | 'Disputed' | 'Banned' | 'Restricted',
		): Promise<Purchase | undefined> {
			try {
				console.log('updatePurchaseStatusForCharge', { chargeId, status })
				const merchantChargeForPurchase =
					await client.query.merchantCharge.findFirst({
						where: or(
							eq(merchantCharge.identifier, chargeId),
							eq(merchantCharge.id, chargeId),
						),
					})

				console.log('merchantChargeForPurchase', { merchantChargeForPurchase })

				const parsedMerchantChargeForPurchase = merchantChargeSchema.parse(
					merchantChargeForPurchase,
				)

				if (!parsedMerchantChargeForPurchase)
					throw new Error(`no-charge-found-for-purchase ${chargeId}`)

				const purchase = await client.query.purchases.findFirst({
					where: eq(
						purchaseTable.merchantChargeId,
						parsedMerchantChargeForPurchase.id,
					),
				})

				const parsedPurchase = purchaseSchema.nullable().parse(purchase)

				if (parsedPurchase) {
					await client
						.update(purchaseTable)
						.set({ status: status })
						.where(eq(purchaseTable.id, parsedPurchase.id))

					const newPurchase = await client.query.purchases.findFirst({
						where: eq(purchaseTable.id, parsedPurchase.id),
					})

					return purchaseSchema.optional().parse(newPurchase)
				} else {
					throw new Error(`no-purchase-found-for-charge ${chargeId}`)
				}
			} catch (e) {
				console.log('error updating purchase status', e)
				throw e
			}
		},
		async updatePurchaseUserTransferTransferState(options: {
			id: string
			transferState: PurchaseUserTransferState
		}): Promise<PurchaseUserTransfer | null> {
			await client
				.update(purchaseUserTransfer)
				.set({
					transferState: options.transferState,
				})
				.where(eq(purchaseUserTransfer.id, options.id))

			const purchaseUserTransferData =
				(await client.query.purchaseUserTransfer.findFirst({
					where: eq(purchaseUserTransfer.id, options.id),
				})) || null

			return purchaseUserTransferSchema
				.nullable()
				.parse(purchaseUserTransferData)
		},
		addResourceToResource: async function (options) {
			const { parentResourceId, childResourceId } = options

			const parentResourceData = await client.query.contentResource.findFirst({
				where: or(
					eq(
						sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
						parentResourceId,
					),
					eq(contentResource.id, parentResourceId),
				),
				with: {
					resources: true,
				},
			})

			const parentResource = ContentResourceSchema.parse(parentResourceData)

			await client.insert(contentResourceResource).values({
				resourceOfId: parentResource.id,
				resourceId: childResourceId,
				position: parentResource.resources?.length || 0,
			})

			const resourceJoin = client.query.contentResourceResource.findFirst({
				where: and(
					eq(contentResourceResource.resourceOfId, parentResourceId),
					eq(contentResourceResource.resourceId, childResourceId),
				),
				with: {
					resource: true,
				},
			})

			const parsedResourceJoin =
				ContentResourceResourceSchema.safeParse(resourceJoin)
			if (!parsedResourceJoin.success) {
				return null
			}

			return parsedResourceJoin.data
		},
		async removeResourceFromResource(options) {
			const { childResourceId, parentResourceId } = options

			const resourceJoin = await client.query.contentResourceResource.findFirst(
				{
					where: and(
						eq(contentResourceResource.resourceOfId, parentResourceId),
						eq(contentResourceResource.resourceId, childResourceId),
					),
				},
			)

			const parsedResourceJoin =
				ContentResourceResourceSchema.safeParse(resourceJoin)
			if (!parsedResourceJoin.success) {
				return null
			}

			await client
				.delete(contentResourceResource)
				.where(
					and(
						eq(contentResourceResource.resourceOfId, parentResourceId),
						eq(contentResourceResource.resourceId, childResourceId),
					),
				)

			return parsedResourceJoin.data.resource
		},
		async updateContentResourceFields(options) {
			if (!options.id) {
				throw new Error('No content resource id.')
			}

			const currentResource = await client
				.select()
				.from(contentResource)
				.where(eq(contentResource.id, options.id))
				.then((res) => res[0])

			await client
				.update(contentResource)
				.set({ fields: { ...currentResource.fields, ...options.fields } })
				.where(eq(contentResource.id, options.id))

			const resource = await client.query.contentResource.findFirst({
				where: eq(contentResource.id, options.id),
				with: {
					resources: {
						with: {
							resource: {
								with: {
									resources: {
										with: {
											resource: true,
										},
										orderBy: asc(contentResourceResource.position),
									},
								},
							},
						},
						orderBy: asc(contentResourceResource.position),
					},
				},
			})

			const parsedResource = ContentResourceSchema.safeParse(resource)

			if (!parsedResource.success) {
				console.error('Error parsing resource', resource)
				return null
			}

			return parsedResource.data
		},
		async getVideoResource(id) {
			if (!id) {
				return null
			}

			const query = sql`
    SELECT
      id as id,
      CAST(updatedAt AS DATETIME) as updatedAt,
      CAST(createdAt AS DATETIME) as createdAt,
      JSON_EXTRACT (${contentResource.fields}, "$.state") AS state,
      JSON_EXTRACT (${contentResource.fields}, "$.duration") AS duration,
      JSON_EXTRACT (${contentResource.fields}, "$.muxPlaybackId") AS muxPlaybackId,
      JSON_EXTRACT (${contentResource.fields}, "$.muxAssetId") AS muxAssetId,
      JSON_EXTRACT (${contentResource.fields}, "$.transcript") AS transcript
    FROM
      ${contentResource}
    WHERE
      type = 'videoResource'
      AND (id = ${id});

 `
			return client
				.execute(query)
				.then((result: any) => {
					const parsedResource = VideoResourceSchema.safeParse(result.rows[0])
					return parsedResource.success ? parsedResource.data : null
				})
				.catch((error) => {
					console.error(error)
					throw error
				})
		},
		async createContentResource(data) {
			const id = data.id || crypto.randomUUID()

			await client.insert(contentResource).values({ ...data, id })

			const resource = await client.query.contentResource.findFirst({
				where: eq(contentResource.id, id),
				with: {
					resources: {
						with: {
							resource: {
								with: {
									resources: {
										with: {
											resource: true,
										},
										orderBy: asc(contentResourceResource.position),
									},
								},
							},
						},
						orderBy: asc(contentResourceResource.position),
					},
				},
			})

			const parsedResource = ContentResourceSchema.safeParse(resource)

			if (!parsedResource.success) {
				console.error('Error parsing resource', resource)
				throw new Error('Error parsing resource')
			}

			return parsedResource.data
		},
		async getContentResource(data) {
			const resource = await client.query.contentResource.findFirst({
				where: or(
					eq(contentResource.id, data),
					eq(
						sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
						`${data}`,
					),
				),
				with: {
					resources: {
						with: {
							resource: {
								with: {
									resources: {
										with: {
											resource: {
												with: {
													resources: {
														with: {
															resource: true,
														},
													},
												},
											},
										},
										orderBy: asc(contentResourceResource.position),
									},
								},
							},
						},
						orderBy: asc(contentResourceResource.position),
					},
				},
			})

			const parsedResource = ContentResourceSchema.safeParse(resource)

			if (!parsedResource.success) {
				console.error('Error parsing resource', resource)
				return null
			}

			return parsedResource.data
		},
		async getEvent(
			eventIdOrSlug: string,
			options?: {
				withResources?: boolean
				withTags?: boolean
				withProducts?: boolean
				withPricing?: boolean
			},
		): Promise<ContentResource | null> {
			const {
				withResources = false,
				withTags = false,
				withProducts = false,
				withPricing = false,
			} = options || {}

			const eventQuery = await client.query.contentResource.findFirst({
				where: and(
					or(
						eq(contentResource.type, 'event'),
						eq(contentResource.type, 'event-series'),
					),
					or(
						eq(contentResource.id, eventIdOrSlug),
						eq(
							sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
							eventIdOrSlug,
						),
					),
				),
				with: {
					...(withResources && {
						resources: {
							with: { resource: true },
							orderBy: asc(contentResourceResource.position),
						},
					}),
					...(withTags && {
						tags: {
							with: { tag: true },
							orderBy: asc(contentResourceTag.position),
						},
					}),
					...(withProducts && {
						resourceProducts: {
							with: {
								product: {
									...(withPricing && {
										with: { price: true },
									}),
								},
							},
						},
					}),
				},
			})

			const parsedEvent = ContentResourceSchema.safeParse(eventQuery)
			if (!parsedEvent.success) {
				logger.debug('Error parsing event', {
					eventQuery,
					error: parsedEvent.error,
				})
				return null
			}

			return parsedEvent.data
		},
		async addResourceToProduct(options: {
			resource: ContentResource
			productId: string
			userId: string
		}) {
			const { resource, productId, userId } = options
			const product = await adapter.getProduct(productId)

			if (!product) {
				throw new Error(`Product not found for id (${productId})`)
			}

			await client.insert(contentResourceProduct).values({
				resourceId: resource.id,
				productId,
				position: product.resources?.length || 0,
				metadata: {
					addedBy: userId,
				},
			})

			const resourceProduct =
				await client.query.contentResourceProduct.findFirst({
					where: eq(contentResourceProduct.resourceId, resource.id),
					with: {
						resource: true,
						product: true,
					},
				})

			return (
				ContentResourceProductSchema.safeParse(resourceProduct).data || null
			)
		},
		async createEvent(
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
					percentageDiscount: string
					expires: Date
				}
			},
			userId: string,
		) {
			const hash = guid()
			const newEventId = slugify(`${input.type}~${hash}`)

			const newEvent = {
				id: newEventId,
				type: 'event',
				fields: {
					title: input.fields.title,
					state: 'draft',
					visibility: 'public',
					slug: slugify(`${input.fields.title}~${hash}`),
					description: input.fields.description,
					startsAt: input.fields.startsAt,
					endsAt: input.fields.endsAt,
				},
				createdById: userId,
			}

			await client.insert(contentResource).values(newEvent)
			const event = await adapter.getEvent(newEventId, {
				withResources: true,
				withTags: true,
				withProducts: true,
				withPricing: true,
			})

			const parsedEvent = ContentResourceSchema.safeParse(event)

			if (!parsedEvent.success) {
				logger.error(new Error('Error parsing event resource'))
				throw new Error('Error parsing event resource')
			}

			// if price is provided, create a product and associate it with the event
			if (input.fields.price && input.fields.price > 0) {
				try {
					const product = await adapter.createProduct({
						name: input.fields.title,
						price: input.fields.price,
						quantityAvailable: input.fields.quantity ?? -1,
						type: 'live',
						state: 'published',
						visibility: 'public',
					})
					if (product) {
						const resourceProduct = await adapter.addResourceToProduct({
							resource: parsedEvent.data,
							productId: product.id,
							userId,
						})
						if (!resourceProduct) {
							logger.error(new Error('Failed to add resource to product'))
							logger.debug('event.addResourceToProduct.failed', {
								eventId: newEventId,
								productId: product.id,
								userId,
							})
						} else {
							logger.debug('event.addResourceToProduct.success', {
								eventId: newEventId,
								productId: product.id,
								userId,
							})
						}
						// Create coupon if enabled
						if (
							input.coupon?.enabled &&
							input.coupon.percentageDiscount &&
							input.coupon.expires
						) {
							try {
								const finalExpires = normalizeExpirationDate(
									input.coupon.expires,
								)
								const couponInput = {
									quantity: '1',
									maxUses: -1,
									expires: finalExpires || null,
									restrictedToProductId: product.id,
									percentageDiscount: input.coupon.percentageDiscount,
									status: 1,
									default: true,
									fields: {
										bypassSoldOut: false,
									},
								}
								await adapter.createCoupon(couponInput)
								logger.debug('event.create.coupon.success', {
									eventId: newEventId,
									productId: product.id,
									userId,
									percentageDiscount: input.coupon.percentageDiscount,
								})
							} catch (couponError) {
								logger.error(
									new Error(
										`Failed to create coupon for event: ${couponError}`,
									),
								)
								logger.debug('event.create.coupon.failed', {
									eventId: newEventId,
									productId: product.id,
									userId,
								})
								// Don't throw here - event creation should succeed even if coupon fails
							}
						}
					} else {
						logger.error(new Error('Failed to create product'))
						logger.debug('event.create.product.failed', {
							eventId: newEventId,
							userId,
							price: input.fields.price,
						})
					}
				} catch (error) {
					logger.error(
						new Error(`Error creating and associating product: ${error}`),
					)
					logger.debug('event.create.product.failed', {
						eventId: newEventId,
						userId,
						price: input.fields.price,
					})
				}
			}

			// if we provide tagIds, we need to associate them with the event
			if (input.fields.tagIds) {
				try {
					await client.insert(contentResourceTag).values(
						input.fields.tagIds.map((tag) => ({
							contentResourceId: newEventId,
							tagId: tag.id,
							createdAt: new Date(),
							updatedAt: new Date(),
							position: 0,
						})),
					)
					logger.debug('event.create.tags.success', {
						eventId: newEventId,
						userId,
						tagIds: input.fields.tagIds,
					})
				} catch (error) {
					logger.error(new Error(`Error associating tags with event: ${error}`))
					logger.debug('event.create.tags.failed', {
						eventId: newEventId,
						userId,
						tagIds: input.fields.tagIds,
					})
				}
			}

			return parsedEvent.data
		},
		async createEventSeries(
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
				coupon?:
					| {
							enabled: boolean
							expires?: Date | undefined
							percentageDiscount?: string | undefined
					  }
					| undefined
			},
			userId: string,
		) {
			const { eventSeries: eventSeriesInput, childEvents: childEventsInput } =
				input

			if (childEventsInput.length === 0) {
				throw new Error('At least one event is required')
			}

			// Execute all database operations within a transaction
			const result = await client.transaction(async (tx) => {
				// Step 1: Create the event series resource
				const eventSeriesHash = guid()
				const eventSeriesResourceId = slugify(`event-series~${eventSeriesHash}`)

				const newEventSeries = {
					id: eventSeriesResourceId,
					type: 'event-series',
					fields: {
						...eventSeriesInput.fields,
						title: eventSeriesInput.fields.title,
						state: 'draft',
						visibility: 'public',
						slug: slugify(
							`${eventSeriesInput.fields.title}~${eventSeriesHash}`,
						),
					},
					createdById: userId,
				}

				await tx.insert(contentResource).values(newEventSeries)

				// Fetch the created event series with relations
				const eventSeriesResource = await tx.query.contentResource.findFirst({
					where: eq(contentResource.id, eventSeriesResourceId),
					with: {
						resources: {
							with: {
								resource: {
									with: {
										resources: {
											with: {
												resource: true,
											},
											orderBy: asc(contentResourceResource.position),
										},
									},
								},
							},
							orderBy: asc(contentResourceResource.position),
						},
						tags: {
							with: {
								tag: true,
							},
							orderBy: asc(contentResourceTag.position),
						},
						resourceProducts: {
							with: {
								product: {
									with: {
										price: true,
									},
								},
							},
						},
					},
				})

				const parsedEventSeries =
					ContentResourceSchema.safeParse(eventSeriesResource)
				if (!parsedEventSeries.success) {
					throw new Error('Error parsing event series resource')
				}

				// Step 2: Associate tags with event series
				if (eventSeriesInput.fields.tagIds) {
					await tx.insert(contentResourceTag).values(
						eventSeriesInput.fields.tagIds.map((tag) => ({
							contentResourceId: eventSeriesResourceId,
							tagId: tag.id,
							createdAt: new Date(),
							updatedAt: new Date(),
							position: 0,
						})),
					)
				}

				// Step 3: Create child events and associate them
				const createdChildEvents = []

				for (let i = 0; i < childEventsInput.length; i++) {
					const childEventInput = childEventsInput[i]

					if (!childEventInput) {
						throw new Error(`Child event input is required`)
					}

					// Create child event
					const childEventHash = guid()
					const childEventResourceId = slugify(`event~${childEventHash}`)

					const newChildEvent = {
						id: childEventResourceId,
						type: 'event',
						fields: {
							title: childEventInput.fields.title,
							startsAt: childEventInput.fields.startsAt,
							endsAt: childEventInput.fields.endsAt,
							description: childEventInput.fields.description,
							state: 'draft',
							visibility: 'public',
							slug: slugify(
								`${childEventInput.fields.title}~${childEventHash}`,
							),
							// No price/quantity - they're on the event series
							price: null,
							quantity: null,
						},
						createdById: userId,
					}

					await tx.insert(contentResource).values(newChildEvent)

					// Fetch the created child event with relations
					const childEventResource = await tx.query.contentResource.findFirst({
						where: eq(contentResource.id, childEventResourceId),
						with: {
							resources: {
								with: {
									resource: {
										with: {
											resources: {
												with: {
													resource: true,
												},
												orderBy: asc(contentResourceResource.position),
											},
										},
									},
								},
								orderBy: asc(contentResourceResource.position),
							},
							tags: {
								with: {
									tag: true,
								},
								orderBy: asc(contentResourceTag.position),
							},
							resourceProducts: {
								with: {
									product: {
										with: {
											price: true,
										},
									},
								},
							},
						},
					})

					const parsedChildEvent =
						ContentResourceSchema.safeParse(childEventResource)
					if (!parsedChildEvent.success) {
						throw new Error(`Error parsing child event resource ${i + 1}`)
					}

					// Associate tags with child event
					if (childEventInput.fields.tagIds) {
						await tx.insert(contentResourceTag).values(
							childEventInput.fields.tagIds.map((tag) => ({
								contentResourceId: childEventResourceId,
								tagId: tag.id,
								createdAt: new Date(),
								updatedAt: new Date(),
								position: 0,
							})),
						)
					}

					// Associate child event with event series
					await tx.insert(contentResourceResource).values({
						resourceOfId: eventSeriesResourceId,
						resourceId: childEventResourceId,
						position: i,
					})

					createdChildEvents.push(parsedChildEvent.data)
				}

				return {
					eventSeries: parsedEventSeries.data,
					childEvents: createdChildEvents,
				}
			})

			const { eventSeries, childEvents } = result

			// Step 4: Handle product creation outside transaction
			if (
				eventSeriesInput.sharedFields.price &&
				eventSeriesInput.sharedFields.price > 0
			) {
				try {
					const product = await adapter.createProduct({
						name: eventSeriesInput.fields.title,
						price: eventSeriesInput.sharedFields.price,
						quantityAvailable: eventSeriesInput.sharedFields.quantity ?? -1,
						type: 'live',
						state: 'published',
						visibility: 'public',
					})
					if (product) {
						await adapter.addResourceToProduct({
							resource: eventSeries,
							productId: product.id,
							userId,
						})

						// Create coupon if enabled
						if (
							input.coupon?.enabled &&
							input.coupon.percentageDiscount &&
							input.coupon.expires
						) {
							try {
								let finalExpires = input.coupon.expires
								if (finalExpires instanceof Date) {
									finalExpires = new Date(
										Date.UTC(
											finalExpires.getUTCFullYear(),
											finalExpires.getUTCMonth(),
											finalExpires.getUTCDate(),
											23,
											59,
											59,
											0,
										),
									)
								}
								const couponInput = {
									quantity: '1',
									maxUses: 1,
									expires: finalExpires,
									restrictedToProductId: product.id,
									percentageDiscount: input.coupon.percentageDiscount,
									status: 1,
									default: true,
									fields: {},
								}
								await adapter.createCoupon(couponInput)
								logger.debug('event.series.coupon.success', {
									eventSeriesId: eventSeries.id,
									productId: product.id,
									userId,
									percentageDiscount: input.coupon.percentageDiscount,
								})
							} catch (couponError) {
								logger.error(
									new Error(
										`Error creating coupon for event series: ${couponError}`,
									),
								)
								logger.debug('event.series.coupon.failed', {
									eventSeriesId: eventSeries.id,
									productId: product.id,
									userId,
								})
								// Don't throw here - event series creation should succeed even if coupon fails
							}
						}
					} else {
						logger.error(new Error('Failed to create product'))
						logger.debug('event.series.product.failed', {
							eventSeriesId: eventSeries.id,
							userId,
							price: eventSeriesInput.sharedFields.price,
						})
					}
				} catch (error) {
					logger.error(
						new Error(`Error creating and associating product: ${error}`),
					)
					logger.debug('event.series.product.creation.failed', {
						eventSeriesId: eventSeries.id,
						userId,
					})
					// Note: We don't throw here since the core data is already committed
				}
			}

			return { eventSeries, childEvents }
		},
		async createCohort(
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
		) {
			const hash = guid()
			const cohortId = `cohort~${hash}`

			// Transaction only handles database operations
			const cohort = await client.transaction(async (tx) => {
				// Create cohort content resource
				await tx.insert(contentResource).values({
					id: cohortId,
					type: 'cohort',
					createdById: userId,
					fields: {
						title: input.cohort.title,
						description: input.cohort.description,
						state: 'draft',
						visibility: 'unlisted',
						slug: slugify(`${input.cohort.title}~${hash}`),
						startsAt: input.dates.start,
						endsAt: input.dates.end,
					},
				})

				// Fetch created cohort
				const cohort = await tx.query.contentResource.findFirst({
					where: eq(contentResource.id, cohortId),
					with: {
						resources: {
							with: {
								resource: true,
							},
							orderBy: asc(contentResourceResource.position),
						},
					},
				})

				if (!cohort) {
					throw new Error('Failed to create cohort')
				}

				const parsedCohort = ContentResourceSchema.safeParse(cohort)
				if (!parsedCohort.success) {
					throw new Error('Invalid cohort data')
				}

				// Associate tags with cohort
				if (input.cohort.tagIds) {
					await tx.insert(contentResourceTag).values(
						input.cohort.tagIds.map((tag) => ({
							contentResourceId: cohortId,
							tagId: tag.id,
							createdAt: new Date(),
							updatedAt: new Date(),
							position: 0,
						})),
					)
				}

				// Link workshops to cohort
				let position = 0
				for (const workshop of input.workshops) {
					await tx.insert(contentResourceResource).values({
						resourceOfId: cohortId,
						resourceId: workshop.id,
						position,
					})
					position++
				}

				return parsedCohort.data
			})

			// Handle product and coupon creation outside transaction
			let product: any = null
			if (
				input.createProduct &&
				input.pricing.price &&
				input.pricing.price > 0
			) {
				try {
					product = await adapter.createProduct({
						name: input.cohort.title,
						price: input.pricing.price,
						quantityAvailable: -1,
						type: 'cohort',
						state: 'published',
						visibility: 'public',
						openEnrollment: new Date().toISOString(),
						closeEnrollment: input.dates.start.toISOString(),
					})

					if (product) {
						// Link product to cohort resource
						await client.insert(contentResourceProduct).values({
							resourceId: cohortId,
							productId: product.id,
							position: 0,
							metadata: {
								addedBy: userId,
							},
						})

						// Create coupon if enabled
						if (
							input.coupon?.enabled &&
							input.coupon.percentageDiscount &&
							input.coupon.expires
						) {
							try {
								const finalExpires = normalizeExpirationDate(
									input.coupon.expires,
								)
								await adapter.createCoupon({
									percentageDiscount: input.coupon.percentageDiscount,
									expires: finalExpires || null,
									restrictedToProductId: product.id,
									default: true,
									maxUses: -1,
									quantity: '-1',
									status: 1,
									fields: {},
								})
								logger.debug('cohort.create.coupon.success', {
									cohortId,
									productId: product.id,
									userId,
									percentageDiscount: input.coupon.percentageDiscount,
								})
							} catch (couponError) {
								logger.error(
									new Error(
										`Failed to create coupon for cohort: ${couponError}`,
									),
								)
								logger.debug('cohort.create.coupon.failed', {
									cohortId,
									productId: product.id,
									userId,
								})
								// Don't throw - cohort creation should succeed even if coupon fails
							}
						}
					}
				} catch (productError) {
					logger.error(
						new Error(`Failed to create product for cohort: ${productError}`),
					)
					logger.debug('cohort.create.product.failed', {
						cohortId,
						userId,
						price: input.pricing.price,
					})
					// Don't throw - cohort creation should succeed even if product fails
				}
			}

			return {
				cohort,
				product,
			}
		},
		async createWorkshop(
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
		) {
			const hash = guid()
			const workshopId = `workshop~${hash}`

			// Transaction only handles database operations
			const result = await client.transaction(async (tx) => {
				// Create workshop content resource
				await tx.insert(contentResource).values({
					id: workshopId,
					type: 'workshop',
					createdById: userId,
					fields: {
						title: input.workshop.title,
						description: input.workshop.description,
						state: 'draft',
						visibility: 'unlisted',
						slug: slugify(`${input.workshop.title}~${hash}`),
					},
				})

				// Fetch created workshop
				const workshop = await tx.query.contentResource.findFirst({
					where: eq(contentResource.id, workshopId),
					with: {
						resources: {
							with: {
								resource: {
									with: {
										resources: {
											with: {
												resource: true,
											},
											orderBy: asc(contentResourceResource.position),
										},
									},
								},
							},
							orderBy: asc(contentResourceResource.position),
						},
					},
				})

				if (!workshop) {
					throw new Error('Failed to create workshop')
				}

				const parsedWorkshop = ContentResourceSchema.safeParse(workshop)
				if (!parsedWorkshop.success) {
					throw new Error('Invalid workshop data')
				}

				// Associate tags with workshop
				if (input.workshop.tagIds) {
					await tx.insert(contentResourceTag).values(
						input.workshop.tagIds.map((tag) => ({
							contentResourceId: workshopId,
							tagId: tag.id,
							createdAt: new Date(),
							updatedAt: new Date(),
							position: 0,
						})),
					)
				}

				// Create sections and lessons
				const createdSections: ContentResource[] = []
				const createdLessons: ContentResource[] = []
				let position = 0

				for (const item of input.structure) {
					if (item.type === 'section') {
						// Create section
						const sectionHash = guid()
						const sectionId = `section~${sectionHash}`

						await tx.insert(contentResource).values({
							id: sectionId,
							type: 'section',
							createdById: userId,
							fields: {
								title: item.title,
								state: 'draft',
								visibility: 'unlisted',
								slug: slugify(`${item.title}~${sectionHash}`),
							},
						})

						// Link section to workshop
						await tx.insert(contentResourceResource).values({
							resourceOfId: workshopId,
							resourceId: sectionId,
							position,
						})

						const section = await tx.query.contentResource.findFirst({
							where: eq(contentResource.id, sectionId),
						})

						if (section) {
							createdSections.push(section as ContentResource)
						}

						// Create lessons in section
						let lessonPosition = 0
						for (const lessonData of item.lessons) {
							const lessonHash = guid()
							const lessonId = `lesson_${lessonHash}`

							await tx.insert(contentResource).values({
								id: lessonId,
								type: 'lesson',
								createdById: userId,
								fields: {
									title: lessonData.title,
									state: 'draft',
									visibility: 'unlisted',
									slug: slugify(`${lessonData.title}~${lessonHash}`),
									lessonType: 'lesson',
								},
							})

							// Link video if provided
							if (lessonData.videoResourceId) {
								await tx.insert(contentResourceResource).values({
									resourceOfId: lessonId,
									resourceId: lessonData.videoResourceId,
									position: 0,
								})
							}

							// Link lesson to section
							await tx.insert(contentResourceResource).values({
								resourceOfId: sectionId,
								resourceId: lessonId,
								position: lessonPosition,
							})

							const lesson = await tx.query.contentResource.findFirst({
								where: eq(contentResource.id, lessonId),
							})

							if (lesson) {
								createdLessons.push(lesson as ContentResource)
							}

							lessonPosition++
						}

						position++
					} else {
						// Create top-level lesson
						const lessonHash = guid()
						const lessonId = `lesson_${lessonHash}`

						await tx.insert(contentResource).values({
							id: lessonId,
							type: 'lesson',
							createdById: userId,
							fields: {
								title: item.title,
								state: 'draft',
								visibility: 'unlisted',
								slug: slugify(`${item.title}~${lessonHash}`),
								lessonType: 'lesson',
							},
						})

						// Link video if provided
						if (item.videoResourceId) {
							await tx.insert(contentResourceResource).values({
								resourceOfId: lessonId,
								resourceId: item.videoResourceId,
								position: 0,
							})
						}

						// Link lesson to workshop
						await tx.insert(contentResourceResource).values({
							resourceOfId: workshopId,
							resourceId: lessonId,
							position,
						})

						const lesson = await tx.query.contentResource.findFirst({
							where: eq(contentResource.id, lessonId),
						})

						if (lesson) {
							createdLessons.push(lesson as ContentResource)
						}

						position++
					}
				}

				return {
					workshop: parsedWorkshop.data,
					sections: createdSections,
					lessons: createdLessons,
				}
			})

			// Handle product and coupon creation outside transaction
			let product: any = null
			if (
				input.createProduct &&
				input.pricing.price &&
				input.pricing.price > 0
			) {
				try {
					product = await adapter.createProduct({
						name: input.workshop.title,
						price: input.pricing.price,
						quantityAvailable: input.pricing.quantity ?? -1,
						type: 'self-paced',
						state: 'published',
						visibility: 'public',
					})

					if (product) {
						// Link product to workshop resource
						await client.insert(contentResourceProduct).values({
							resourceId: workshopId,
							productId: product.id,
							position: 0,
							metadata: {
								addedBy: userId,
							},
						})

						// Create coupon if enabled
						if (
							input.coupon?.enabled &&
							input.coupon.percentageDiscount &&
							input.coupon.expires
						) {
							try {
								const finalExpires = normalizeExpirationDate(
									input.coupon.expires,
								)
								await adapter.createCoupon({
									percentageDiscount: input.coupon.percentageDiscount,
									expires: finalExpires || null,
									restrictedToProductId: product.id,
									default: true,
									maxUses: -1,
									quantity: '-1',
									status: 1,
									fields: {},
								})
								logger.debug('workshop.create.coupon.success', {
									workshopId,
									productId: product.id,
									userId,
									percentageDiscount: input.coupon.percentageDiscount,
								})
							} catch (couponError) {
								logger.error(
									new Error(
										`Failed to create coupon for workshop: ${couponError}`,
									),
								)
								logger.debug('workshop.create.coupon.failed', {
									workshopId,
									productId: product.id,
									userId,
								})
								// Don't throw - workshop creation should succeed even if coupon fails
							}
						}
					}
				} catch (productError) {
					logger.error(
						new Error(`Failed to create product for workshop: ${productError}`),
					)
					logger.debug('workshop.create.product.failed', {
						workshopId,
						userId,
						price: input.pricing.price,
					})
					// Don't throw - workshop creation should succeed even if product fails
				}
			}

			return {
				...result,
				product,
			}
		},
		async createCoupon(input: {
			quantity: string
			maxUses: number
			expires: Date | null
			restrictedToProductId: string | null
			percentageDiscount: string
			status: number
			default: boolean
			fields: Record<string, any>
		}) {
			function findClosestDiscount(percentOff: number) {
				// we want a fraction so if it is whole number, we make it fractional
				percentOff = percentOff <= 1 ? percentOff : percentOff / 100
				return [1, 0.95, 0.9, 0.75, 0.6, 0.5, 0.4, 0.25, 0.1].reduce((a, b) => {
					let aDiff = Math.abs(a - percentOff)
					let bDiff = Math.abs(b - percentOff)

					if (aDiff === bDiff) {
						// Choose largest vs smallest (> vs <)
						return a > b ? a : b
					} else {
						return bDiff < aDiff ? b : a
					}
				})
			}

			const percentageDiscount = findClosestDiscount(
				Number(input.percentageDiscount) * 100,
			)

			const merchantCouponResult =
				percentageDiscount < 1
					? await client.query.merchantCoupon.findFirst({
							where: and(
								eq(
									merchantCoupon.percentageDiscount,
									percentageDiscount.toString(),
								),
								eq(merchantCoupon.type, 'special'),
							),
						})
					: null

			if (!merchantCouponResult) {
				return []
			}

			const codesArray: string[] = []
			await client.transaction(async (trx) => {
				// insert coupon for CouponInput quantity
				for (let i = 0; i < Number(input.quantity); i++) {
					const id = `coupon_${guid()}`
					await trx.insert(coupon).values({
						...input,
						merchantCouponId: merchantCouponResult.id as string,
						id,
					})
					codesArray.push(id)
				}
			})

			return codesArray
		},
		async createUser(data) {
			try {
				const id = crypto.randomUUID()

				await client.insert(users).values({ ...data, id })

				// creating a personal organization for the user
				// every user gets an organization of their very own
				const personalOrganization = await adapter.createOrganization({
					name: `Personal (${data.email})`,
				})

				if (!personalOrganization) {
					throw new Error('Failed to create personal organization')
				}

				const membership = await adapter.addMemberToOrganization({
					organizationId: personalOrganization.id,
					userId: id,
					invitedById: id,
				})

				if (!membership) {
					throw new Error('Failed to add user to personal organization')
				}

				await adapter.addRoleForMember({
					organizationId: personalOrganization.id,
					memberId: membership.id,
					role: 'owner',
				})

				const user = await adapter.getUser?.(id)

				if (!user) {
					throw new Error('Failed to get user')
				}

				return user
			} catch (error) {
				console.error(error)
				throw error
			}
		},
		async getUser(data) {
			return (
				(await client
					.select()
					.from(users)
					.where(eq(users.id, data))
					.then((res) => res[0])) ?? null
			)
		},
		async getUserByEmail(data) {
			return (
				(await client
					.select()
					.from(users)
					.where(eq(users.email, data))
					.then((res) => res[0])) ?? null
			)
		},
		async createSession(data) {
			await client.insert(sessions).values(data)

			return await client
				.select()
				.from(sessions)
				.where(eq(sessions.sessionToken, data.sessionToken))
				.then((res) => res[0] as AdapterSession)
		},
		async getSessionAndUser(data) {
			return (
				(await client
					.select({
						session: sessions,
						user: users,
					})
					.from(sessions)
					.where(eq(sessions.sessionToken, data))
					.innerJoin(users, eq(users.id, sessions.userId))
					.then((res) => res[0])) ?? null
			)
		},
		async updateUser(data) {
			if (!data.id) {
				throw new Error('No user id.')
			}

			await client.update(users).set(data).where(eq(users.id, data.id))

			return await client
				.select()
				.from(users)
				.where(eq(users.id, data.id))
				.then((res) => res[0] as AdapterUser)
		},
		async updateSession(data) {
			await client
				.update(sessions)
				.set(data)
				.where(eq(sessions.sessionToken, data.sessionToken))

			return await client
				.select()
				.from(sessions)
				.where(eq(sessions.sessionToken, data.sessionToken))
				.then((res) => res[0])
		},
		async linkAccount(rawAccount) {
			await client.insert(accounts).values(rawAccount)
		},
		async getUserByAccount(account) {
			const dbAccount =
				(await client
					.select()
					.from(accounts)
					.where(
						and(
							eq(accounts.providerAccountId, account.providerAccountId),
							eq(accounts.provider, account.provider),
						),
					)
					.leftJoin(users, eq(accounts.userId, users.id))
					.then((res) => res[0])) ?? null

			if (!dbAccount) {
				return null
			}

			return dbAccount.User
		},
		async deleteSession(sessionToken) {
			const session =
				(await client
					.select()
					.from(sessions)
					.where(eq(sessions.sessionToken, sessionToken))
					.then((res) => res[0])) ?? null

			await client
				.delete(sessions)
				.where(eq(sessions.sessionToken, sessionToken))

			return session
		},
		async createVerificationToken(token) {
			await client.insert(verificationTokens).values(token)

			return await client
				.select()
				.from(verificationTokens)
				.where(eq(verificationTokens.identifier, token.identifier))
				.then((res) => res[0])
		},
		async useVerificationToken(token) {
			try {
				const deletedToken =
					(await client
						.select()
						.from(verificationTokens)
						.where(
							and(
								eq(verificationTokens.identifier, token.identifier),
								eq(verificationTokens.token, token.token),
							),
						)
						.then((res) => res[0])) ?? null

				if (deletedToken?.createdAt) {
					const TIMEOUT_IN_SECONDS = 90
					const expireMultipleClicks = addSeconds(
						deletedToken.createdAt,
						TIMEOUT_IN_SECONDS,
					)
					const now = new Date()

					if (isAfter(expireMultipleClicks, now)) {
						// @ts-ignore
						const { id: _, ...verificationToken } = token
						return deletedToken
					} else {
						await client
							.delete(verificationTokens)
							.where(
								and(
									eq(verificationTokens.identifier, token.identifier),
									eq(verificationTokens.token, token.token),
								),
							)
						return deletedToken
					}
				}

				return deletedToken
			} catch (err) {
				throw new Error('No verification token found.')
			}
		},
		async deleteUser(id) {
			const user = await client
				.select()
				.from(users)
				.where(eq(users.id, id))
				.then((res) => res[0] ?? null)

			await client.delete(users).where(eq(users.id, id))
			await client.delete(sessions).where(eq(sessions.userId, id))
			await client.delete(accounts).where(eq(accounts.userId, id))

			return user
		},
		async unlinkAccount(account) {
			await client
				.delete(accounts)
				.where(
					and(
						eq(accounts.providerAccountId, account.providerAccountId),
						eq(accounts.provider, account.provider),
					),
				)

			return undefined
		},
		createOrganization: async (options: { name: string }) => {
			const organizationId = crypto.randomUUID()
			await client.insert(organizationTable).values({
				...options,
				id: organizationId,
			})

			return adapter.getOrganization(organizationId)
		},
		getOrganization: async (organizationId: string) => {
			return OrganizationSchema.parse(
				await client.query.organization.findFirst({
					where: eq(organizationTable.id, organizationId),
				}),
			)
		},
		addMemberToOrganization: async (options: {
			organizationId: string
			userId: string
			invitedById: string
		}) => {
			const currentMembership =
				await client.query.organizationMemberships.findFirst({
					where: and(
						eq(
							organizationMembershipTable.organizationId,
							options.organizationId,
						),
						eq(organizationMembershipTable.userId, options.userId),
					),
					with: {
						organization: true,
						user: true,
					},
				})

			if (currentMembership) {
				return OrganizationMemberSchema.parse(currentMembership)
			} else {
				const id = crypto.randomUUID()
				await client.insert(organizationMembershipTable).values({
					...options,
					id,
				})

				return OrganizationMemberSchema.parse(
					await client.query.organizationMemberships.findFirst({
						where: eq(organizationMembershipTable.id, id),
						with: {
							organization: true,
							user: true,
						},
					}),
				)
			}
		},
		removeMemberFromOrganization: async (options: {
			organizationId: string
			userId: string
		}) => {
			await client
				.delete(organizationMembershipTable)
				.where(
					and(
						eq(
							organizationMembershipTable.organizationId,
							options.organizationId,
						),
						eq(organizationMembershipTable.userId, options.userId),
					),
				)
		},
		addRoleForMember: async (options: {
			organizationId: string
			memberId: string
			role: string
		}) => {
			const existingRole = z
				.object({
					id: z.string(),
				})
				.nullish()
				.parse(
					await client.query.roles.findFirst({
						where: and(
							eq(roleTable.organizationId, options.organizationId),
							eq(roleTable.name, options.role),
						),
					}),
				)

			const roleId = existingRole?.id || crypto.randomUUID()

			if (!existingRole) {
				await client.insert(roleTable).values({
					name: options.role,
					organizationId: options.organizationId,
					id: roleId,
				})
			}

			const currentOrgMembershipRole =
				await client.query.organizationMembershipRoles.findFirst({
					where: and(
						eq(
							organizationMembershipRoleTable.organizationMembershipId,
							options.memberId,
						),
						eq(organizationMembershipRoleTable.roleId, roleId),
					),
				})

			if (!currentOrgMembershipRole) {
				await client.insert(organizationMembershipRoleTable).values({
					organizationId: options.organizationId,
					organizationMembershipId: options.memberId,
					roleId,
				})
			}
		},
		removeRoleForMember: async (options: {
			organizationId: string
			memberId: string
			role: string
		}) => {
			const existingRole = z
				.object({
					id: z.string(),
				})
				.nullable()
				.parse(
					await client.query.roles.findFirst({
						where: and(
							eq(roleTable.organizationId, options.organizationId),
							eq(roleTable.name, options.role),
						),
					}),
				)

			const roleId = existingRole?.id

			if (roleId) {
				await client
					.delete(organizationMembershipRoleTable)
					.where(eq(organizationMembershipRoleTable.roleId, roleId))
			}
		},
		getMembershipsForUser: async (userId: string) => {
			return OrganizationMemberSchema.array().parse(
				(await client.query.organizationMemberships.findMany({
					where: eq(organizationMembershipTable.userId, userId),
					with: {
						organization: true,
						user: true,
					},
				})) || [],
			)
		},
		getOrganizationMembers: async (organizationId: string) => {
			return OrganizationMemberSchema.array().parse(
				(await client.query.organizationMemberships.findMany({
					where: eq(organizationMembershipTable.organizationId, organizationId),
				})) || [],
			)
		},
		createSubscription: async (options: {
			organizationId: string
			merchantSubscriptionId: string
			productId: string
		}) => {
			const id = `sub_${crypto.randomUUID()}`
			await client.insert(subscriptionTable).values({
				...options,
				id,
			})

			return SubscriptionSchema.parse(
				await client.query.subscription.findFirst({
					where: eq(subscriptionTable.id, id),
					with: {
						product: true,
					},
				}),
			)
		},
		getMerchantSubscription: async (merchantSubscriptionId: string) => {
			return MerchantSubscriptionSchema.parse(
				await client.query.merchantSubscription.findFirst({
					where: eq(merchantSubscriptionTable.id, merchantSubscriptionId),
				}),
			)
		},
		createMerchantSubscription: async (options: {
			merchantAccountId: string
			merchantCustomerId: string
			merchantProductId: string
			identifier: string
		}) => {
			const id = crypto.randomUUID()
			await client.insert(merchantSubscriptionTable).values({
				...options,
				id,
			})

			return MerchantSubscriptionSchema.parse(
				await client.query.merchantSubscription.findFirst({
					where: eq(merchantSubscriptionTable.id, id),
				}),
			)
		},
		updateMerchantSubscription: async (options: {
			merchantSubscriptionId: string
			status: string
		}) => {
			throw new Error('Not implemented')
		},
		deleteMerchantSubscription: async (merchantSubscriptionId: string) => {
			throw new Error('Not implemented')
		},
		getSubscriptionForStripeId: async (stripeSubscriptionId: string) => {
			const merchantSubscriptionParsed = MerchantSubscriptionSchema.safeParse(
				await client.query.merchantSubscription.findFirst({
					where: eq(merchantSubscriptionTable.identifier, stripeSubscriptionId),
				}),
			)

			if (!merchantSubscriptionParsed.success) {
				throw new Error(
					`No merchant subscription found for stripe id ${stripeSubscriptionId} ${merchantSubscriptionParsed.error}`,
				)
			}

			const subscriptionParsed = SubscriptionSchema.safeParse(
				await client.query.subscription.findFirst({
					where: eq(
						subscriptionTable.merchantSubscriptionId,
						merchantSubscriptionParsed.data.id,
					),
					with: {
						product: true,
					},
				}),
			)

			if (!subscriptionParsed.success) {
				throw new Error(
					`No subscription found for merchant subscription ${merchantSubscriptionParsed.data.id} ${subscriptionParsed.error}`,
				)
			}

			return subscriptionParsed.data
		},
	}

	return adapter
}
