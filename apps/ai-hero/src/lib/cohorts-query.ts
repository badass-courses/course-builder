import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'
import { courseBuilderAdapter, db } from '@/db'
import {
	accounts as accountsTable,
	contentResource,
	contentResourceResource,
	entitlements as entitlementsTable,
	entitlementTypes,
	organizationMemberships,
	products,
	purchases,
} from '@/db/schema'
import { env } from '@/env.mjs'
import { getServerAuthSession } from '@/server/auth'
import { and, asc, count, eq, gt, isNull, or, sql } from 'drizzle-orm'

import { propsForCommerce } from '@coursebuilder/core/pricing/props-for-commerce'
import type { User } from '@coursebuilder/core/schemas'
import {
	Product,
	productSchema,
	Purchase as PurchaseSchema,
} from '@coursebuilder/core/schemas'
import type { PricingData } from '@coursebuilder/core/types'
import { first } from '@coursebuilder/nodash'

import { checkCohortCertificateEligibilityFromWorkshops } from './certificates'
import { CohortAccess, CohortSchema } from './cohort'
import type { Cohort } from './cohort'
import { getPricingData } from './pricing-query'
import { getModuleProgressForUser } from './progress'
import { getSaleBannerData } from './sale-banner'
import { WorkshopSchema } from './workshops'
import type { Workshop } from './workshops'

export async function getCohort(cohortIdOrSlug: string) {
	const cohortData = await db.query.contentResource.findFirst({
		where: and(
			eq(contentResource.type, 'cohort'),
			or(
				eq(contentResource.id, cohortIdOrSlug),
				eq(
					sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
					cohortIdOrSlug,
				),
			),
		),
		with: {
			resources: {
				with: {
					resource: {
						with: {
							resources: {
								with: {
									resource: true,
								},
								orderBy: [asc(contentResourceResource.position)],
							},
						},
					},
				},
				orderBy: [asc(contentResourceResource.position)],
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

	const parsedCohort = CohortSchema.safeParse(cohortData)
	if (!parsedCohort.success) {
		console.error('Error parsing cohort:', {
			errors: parsedCohort.error.errors,
			data: cohortData,
		})
		return null
	}

	return parsedCohort.data
}

export const getCachedCohort = unstable_cache(
	async (cohortIdOrSlug: string) => getCohort(cohortIdOrSlug),
	['cohort'],
	{ revalidate: 3600, tags: ['cohort'] },
)

export type CohortPageData = {
	cohort: Cohort
	session: Awaited<ReturnType<typeof getServerAuthSession>>['session']
	ability: Awaited<ReturnType<typeof getServerAuthSession>>['ability']
	user:
		| NonNullable<
				Awaited<ReturnType<typeof getServerAuthSession>>['session']
		  >['user']
		| null
	currentOrganization: string | null
	hasCompletedCohort: boolean
	product: Product | null
	pricingDataLoader: ReturnType<typeof getPricingData>
	commerceProps: Awaited<ReturnType<typeof propsForCommerce>>
	purchaseCount: number
	quantityAvailable: number
	totalQuantity: number
	hasPurchasedCurrentProduct: boolean
	existingPurchase:
		| Awaited<
				ReturnType<typeof courseBuilderAdapter.getPurchaseDetails>
		  >['existingPurchase']
		| null
	defaultCoupon:
		| Extract<
				Awaited<ReturnType<typeof courseBuilderAdapter.getDefaultCoupon>>,
				{ defaultCoupon: unknown }
		  >['defaultCoupon']
		| null
	saleData: Awaited<ReturnType<typeof getSaleBannerData>> | null
	workshops: Workshop[]
	workshopProgressMap: Map<string, Promise<any>>
}

export async function loadCohortPageData(
	cohortSlug: string,
	searchParams: Record<string, string | string[] | undefined>,
): Promise<CohortPageData> {
	const [cohort, authResult] = await Promise.all([
		getCachedCohort(cohortSlug),
		getServerAuthSession(),
	])

	if (!cohort) {
		throw new Error(`Cohort not found: ${cohortSlug}`)
	}

	const session = authResult?.session ?? null
	const ability = authResult?.ability ?? null
	const user = session?.user ?? null
	const headerList = await headers()
	const currentOrganization = headerList.get('x-organization-id')

	const workshops: Workshop[] =
		cohort.resources?.map((resource) => resource.resource) ?? []

	const certificatePromise = checkCohortCertificateEligibilityFromWorkshops(
		workshops,
		user?.id,
	)

	const rawProduct = first(cohort.resourceProducts)?.product
	const productToValidate =
		rawProduct && rawProduct.price
			? {
					...rawProduct,
					price: {
						...rawProduct.price,
						createdAt:
							typeof rawProduct.price.createdAt === 'string'
								? new Date(rawProduct.price.createdAt)
								: rawProduct.price.createdAt,
						updatedAt:
							typeof rawProduct.price.updatedAt === 'string'
								? new Date(rawProduct.price.updatedAt)
								: rawProduct.price.updatedAt,
					},
				}
			: rawProduct

	const productParsed = productSchema.safeParse(productToValidate)

	let product: Product | null = null
	let pricingDataLoader: ReturnType<typeof getPricingData> =
		Promise.resolve<PricingData>({
			formattedPrice: null,
			purchaseToUpgrade: null,
			quantityAvailable: -1,
		})
	let commerceProps: Awaited<ReturnType<typeof propsForCommerce>>
	let purchaseCount = 0
	let quantityAvailable = -1
	let totalQuantity = 0
	let hasPurchasedCurrentProduct = false
	let existingPurchase: CohortPageData['existingPurchase'] = null
	let defaultCoupon: CohortPageData['defaultCoupon'] = null
	let saleData: CohortPageData['saleData'] = null

	if (productParsed.success) {
		product = productParsed.data

		const countryCode =
			headerList.get('x-vercel-ip-country') ||
			process.env.DEFAULT_COUNTRY ||
			'US'

		const [commercePropsResult, purchaseCountResult, productQuantityResult] =
			await Promise.all([
				propsForCommerce(
					{
						query: searchParams,
						userId: user?.id,
						products: [product],
						countryCode,
					},
					courseBuilderAdapter,
				),
				db
					.select({ count: count() })
					.from(purchases)
					.where(eq(purchases.productId, product.id))
					.then((res) => res[0] ?? { count: 0 }),
				db
					.select({ quantityAvailable: products.quantityAvailable })
					.from(products)
					.where(eq(products.id, product.id))
					.then((res) => res[0]),
			])

		const couponResult = await courseBuilderAdapter.getDefaultCoupon([
			product.id,
		])
		const defaultCouponFromAdapter = couponResult?.defaultCoupon ?? null

		commerceProps = {
			...commercePropsResult,
			products: [product],
		}

		// Determine the active merchant coupon for pricing data
		let merchantCouponId: string | undefined
		let usedCouponId: string | undefined

		if (defaultCouponFromAdapter?.merchantCouponId) {
			merchantCouponId = defaultCouponFromAdapter.merchantCouponId
			usedCouponId = defaultCouponFromAdapter.id
		} else if (commerceProps.couponIdFromCoupon) {
			// If there's a coupon from commerce props, get its merchant coupon
			const coupon = await courseBuilderAdapter.couponForIdOrCode({
				couponId: commerceProps.couponIdFromCoupon,
			})
			if (coupon?.merchantCoupon?.id) {
				merchantCouponId = coupon.merchantCoupon.id
				usedCouponId = coupon.id
			}
		} else if (commerceProps.couponFromCode?.merchantCoupon?.id) {
			merchantCouponId = commerceProps.couponFromCode.merchantCoupon.id
			usedCouponId = commerceProps.couponFromCode.id
		}

		// Create pricing data loader with coupon information
		pricingDataLoader = getPricingData({
			productId: product.id,
			merchantCouponId,
			usedCouponId,
		})

		purchaseCount = purchaseCountResult.count
		const productQuantity = productQuantityResult?.quantityAvailable ?? -1
		totalQuantity = productQuantity >= 0 ? productQuantity : 0

		quantityAvailable =
			productQuantity >= 0 ? Math.max(0, productQuantity - purchaseCount) : -1

		const currentProductId = product?.id

		if (user && currentProductId) {
			const purchaseForProduct = commerceProps.purchases?.find(
				(purchase: PurchaseSchema) => purchase.productId === currentProductId,
			)

			if (purchaseForProduct) {
				const purchaseDetails = await courseBuilderAdapter.getPurchaseDetails(
					purchaseForProduct.id,
					user.id,
				)

				hasPurchasedCurrentProduct = Boolean(
					purchaseDetails.purchase &&
						(purchaseDetails.purchase.status === 'Valid' ||
							purchaseDetails.purchase.status === 'Restricted'),
				)
				existingPurchase = purchaseDetails.existingPurchase
			}
		}

		if (defaultCouponFromAdapter) {
			defaultCoupon = defaultCouponFromAdapter
			saleData = await getSaleBannerData(defaultCouponFromAdapter)
		}
	} else {
		commerceProps = await propsForCommerce(
			{
				query: searchParams,
				userId: user?.id,
				products: [],
				countryCode:
					headerList.get('x-vercel-ip-country') ||
					process.env.DEFAULT_COUNTRY ||
					'US',
			},
			courseBuilderAdapter,
		)

		commerceProps.products = []
	}

	const workshopProgressMap = new Map<string, Promise<any>>()
	if (user) {
		for (const workshop of workshops) {
			workshopProgressMap.set(
				workshop.fields.slug,
				getModuleProgressForUser(workshop.fields.slug),
			)
		}
	}

	const { hasCompletedCohort } = await certificatePromise

	return {
		cohort,
		session,
		ability,
		user,
		currentOrganization,
		hasCompletedCohort,
		product,
		pricingDataLoader,
		commerceProps,
		purchaseCount,
		quantityAvailable,
		totalQuantity,
		hasPurchasedCurrentProduct,
		existingPurchase,
		defaultCoupon,
		saleData,
		workshops,
		workshopProgressMap,
	}
}

/**
 * Get all modules in a cohort
 * @param cohortId - The ID of the cohort to get modules for
 * @returns An array of modules
 */
export async function getAllWorkshopsInCohort(cohortId: string) {
	try {
		const results = await db
			.select()
			.from(contentResourceResource)
			.innerJoin(
				contentResource,
				eq(contentResource.id, contentResourceResource.resourceId),
			)
			.where(
				and(
					eq(contentResource.type, 'workshop'),
					eq(contentResourceResource.resourceOfId, cohortId),
				),
			)
			.orderBy(asc(contentResourceResource.position))

		return results.map((r) => {
			const parsed = WorkshopSchema.safeParse(r.ContentResource)
			if (!parsed.success) {
				console.error(
					'Failed to parse workshop:',
					parsed.error,
					r.ContentResource,
				)
				throw new Error(`Invalid workshop data for cohort ${cohortId}`)
			}
			return parsed.data
		})
	} catch (error) {
		console.error('Failed to get workshops in cohort:', error)
		throw error
	}
}
/**
 * Check if a user has access to a cohort
 * @param organizationId - The ID of the organization to check cohort access for
 * @param userId - The ID of the user to check cohort access for
 * @param cohortSlug - The slug of the cohort to check access for
 * @returns The cohort access information if the user has access, null otherwise
 */
export async function checkCohortAccess(
	organizationId: string,
	userId: string,
	cohortSlug: string,
): Promise<CohortAccess | null> {
	// First, get the user's membership in the organization
	const membership = await db.query.organizationMemberships.findFirst({
		where: and(
			eq(organizationMemberships.organizationId, organizationId),
			eq(organizationMemberships.userId, userId),
		),
	})

	if (!membership) {
		return null // User is not a member of the organization
	}

	const cohortEntitlementType = await db.query.entitlementTypes.findFirst({
		where: eq(entitlementTypes.name, 'cohort_content_access'),
	})

	if (!cohortEntitlementType) {
		return null // Cohort entitlement type not found
	}

	const validEntitlements = await db.query.entitlements.findMany({
		where: and(
			eq(entitlementsTable.organizationMembershipId, membership.id), // Use membershipId
			eq(entitlementsTable.entitlementType, cohortEntitlementType.id),
			or(
				isNull(entitlementsTable.expiresAt),
				gt(entitlementsTable.expiresAt, sql`CURRENT_TIMESTAMP`),
			),
			isNull(entitlementsTable.deletedAt),
		),
	})

	const cohortEntitlement = validEntitlements.find(
		(e) => e.sourceType === 'cohort',
	)

	if (!cohortEntitlement || !cohortEntitlement.metadata) return null

	return {
		tier: cohortEntitlement.metadata.tier,
		contentIds: cohortEntitlement.metadata.contentIds,
		expiresAt: cohortEntitlement.expiresAt,
		discordRoleId: cohortEntitlement.metadata.discordRoleId,
	}
}

/**
 * Sync the Discord roles for a user
 * @param organizationId - The ID of the organization to sync the Discord roles for
 * @param user - The user to sync the Discord roles for
 */
export async function syncDiscordRoles(organizationId: string, user: User) {
	const accounts = await db.query.accounts.findMany({
		where: and(
			eq(accountsTable.userId, user.id),
			eq(accountsTable.provider, 'discord'),
		),
	})

	const discordAccount = accounts[0]
	if (!discordAccount?.access_token) return

	// Get the user's membership in the specified organization
	const membership = await db.query.organizationMemberships.findFirst({
		where: and(
			eq(organizationMemberships.organizationId, organizationId),
			eq(organizationMemberships.userId, user.id),
		),
	})

	if (!membership) {
		return // User is not a member of this organization
	}

	const entitlements = await db.query.entitlements.findMany({
		where: and(
			eq(entitlementsTable.organizationMembershipId, membership.id),
			eq(entitlementsTable.entitlementType, 'cohort_discord_role'),
			or(
				isNull(entitlementsTable.expiresAt),
				gt(entitlementsTable.expiresAt, sql`CURRENT_TIMESTAMP`),
			),
			isNull(entitlementsTable.deletedAt),
		),
	})

	try {
		const currentRoles = await fetchDiscordRoles(discordAccount.access_token)
		const requiredRoles = entitlements.flatMap((e) => e.metadata?.roleIds || [])

		for (const roleId of requiredRoles) {
			if (!currentRoles.includes(roleId)) {
				await addDiscordRole(discordAccount.access_token, roleId)
			}
		}
	} catch (error) {
		console.error('Failed to sync Discord roles:', error)
		throw new Error('Discord role sync failed')
	}
}

async function fetchDiscordRoles(accessToken: string): Promise<string[]> {
	const response = await fetch('https://discord.com/api/users/@me/guilds', {
		headers: { Authorization: `Bearer ${accessToken}` },
	})

	if (!response.ok) return []
	const guilds = await response.json()
	return guilds.flatMap((g: any) => g.roles || [])
}

/**
 * Add a Discord role to a user
 * @param accessToken - The access token for the user
 * @param roleId - The ID of the role to add
 */
async function addDiscordRole(accessToken: string, roleId: string) {
	await fetch(
		`https://discord.com/api/guilds/${env.DISCORD_GUILD_ID}/members/@me/roles/${roleId}`,
		{
			method: 'PUT',
			headers: {
				Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
				'Content-Type': 'application/json',
			},
		},
	)
}
