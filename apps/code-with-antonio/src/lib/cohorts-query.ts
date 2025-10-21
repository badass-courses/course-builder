'use server'

import type { ParsedUrlQuery } from 'querystring'
import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'
import type { CohortPageProps } from '@/app/(content)/cohorts/[slug]/_components/cohort-page-props'
import { courseBuilderAdapter, db } from '@/db'
import {
	accounts as accountsTable,
	contentResource,
	contentResourceProduct,
	contentResourceResource,
	contentResourceTag as contentResourceTagTable,
	entitlements as entitlementsTable,
	entitlementTypes,
	organizationMemberships,
	products,
	purchases,
} from '@/db/schema'
import { env } from '@/env.mjs'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { and, asc, count, eq, gt, isNull, or, sql } from 'drizzle-orm'

import { propsForCommerce } from '@coursebuilder/core/lib/pricing/props-for-commerce'
import {
	ContentResourceSchema,
	productSchema,
	type Product,
	type Purchase,
	type User,
} from '@coursebuilder/core/schemas'
import { first } from '@coursebuilder/nodash'

import {
	CohortAccess,
	CohortSchema,
	type Cohort,
	type CreateCohortWithWorkshopsInput,
} from './cohort'
import { getPricingData } from './pricing-query'
import { upsertPostToTypeSense } from './typesense-query'
import { WorkshopSchema } from './workshops'

export const getCachedCohort = unstable_cache(
	async (cohortIdOrSlug: string) => getCohort(cohortIdOrSlug),
	['cohort'],
	{ revalidate: 3600, tags: ['cohort'] },
)

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
			tags: {
				with: {
					tag: true,
				},
				orderBy: asc(contentResourceTagTable.position),
			},
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

export async function getCountryCode(): Promise<string> {
	const countryCode =
		(await headers()).get('x-vercel-ip-country') ||
		process.env.DEFAULT_COUNTRY ||
		'US'
	return countryCode
}

export async function getCurrentOrganization(): Promise<string | null> {
	return (await headers()).get('x-organization-id') ?? null
}
export async function getCohortPricing(
	cohort: Cohort,
	searchParams: ParsedUrlQuery,
): Promise<CohortPageProps> {
	const { session } = await getServerAuthSession()
	const user = session?.user
	const currentOrganization = await getCurrentOrganization()
	const countryCode = await getCountryCode()

	let product: Product | null = null
	let cohortProps: CohortPageProps

	const productParsed = productSchema.safeParse(
		first(cohort.resourceProducts)?.product,
	)

	if (productParsed.success) {
		product = productParsed.data

		const pricingDataLoader = getPricingData({
			productId: product.id,
		})

		const commerceProps = await propsForCommerce(
			{
				query: {
					...searchParams,
				},
				userId: user?.id,
				products: [product],
				countryCode,
			},
			courseBuilderAdapter,
		)

		const { count: purchaseCount } = await db
			.select({ count: count() })
			.from(purchases)
			.where(eq(purchases.productId, product.id))
			.then((res) => res[0] ?? { count: 0 })

		const productWithQuantityAvailable = await db
			.select({ quantityAvailable: products.quantityAvailable })
			.from(products)
			.where(eq(products.id, product.id))
			.then((res) => res[0])

		let quantityAvailable = -1

		if (productWithQuantityAvailable) {
			quantityAvailable =
				productWithQuantityAvailable.quantityAvailable - purchaseCount
		}

		if (quantityAvailable < 0) {
			quantityAvailable = -1
		}

		const baseProps = {
			cohort,
			availableBonuses: [],
			purchaseCount,
			quantityAvailable,
			totalQuantity: productWithQuantityAvailable?.quantityAvailable || 0,
			product,
			pricingDataLoader,
			organizationId: currentOrganization,

			...commerceProps,
		}

		if (!user) {
			cohortProps = baseProps
		} else {
			const purchaseForProduct = commerceProps.purchases?.find(
				(purchase: Purchase) => {
					return purchase.productId === productSchema.parse(product).id
				},
			)

			if (!purchaseForProduct) {
				cohortProps = baseProps
			} else {
				const { purchase, existingPurchase } =
					await courseBuilderAdapter.getPurchaseDetails(
						purchaseForProduct.id,
						user.id,
					)
				cohortProps = {
					...baseProps,
					hasPurchasedCurrentProduct: Boolean(
						purchase &&
							(purchase.status === 'Valid' || purchase.status === 'Restricted'),
					),
					existingPurchase,
				}
			}
		}
	} else {
		cohortProps = {
			cohort,
			availableBonuses: [],
			quantityAvailable: -1,
			totalQuantity: -1,
			purchaseCount: 0,
			hasPurchasedCurrentProduct: false,
			product: undefined,
			pricingDataLoader: Promise.resolve({
				formattedPrice: null,
				purchaseToUpgrade: null,
				quantityAvailable: -1,
			}),
		}
	}

	return cohortProps
}

/**
 * Creates a cohort with workshops in bulk
 * Supports product/pricing/coupon creation
 */
export async function createCohortWithWorkshops(
	input: CreateCohortWithWorkshopsInput,
) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	try {
		// Execute all in transaction
		const result = await db.transaction(async (tx) => {
			// 1. Create cohort
			const cohortHash = guid()
			const cohortId = `cohort~${cohortHash}`

			await tx.insert(contentResource).values({
				id: cohortId,
				type: 'cohort',
				createdById: user.id,
				fields: {
					title: input.cohort.title,
					description: input.cohort.description,
					state: 'draft',
					visibility: 'unlisted',
					slug: slugify(`${input.cohort.title}~${cohortHash}`),
					startsAt: input.dates.start.toISOString(),
					endsAt: input.dates.end.toISOString(),
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

			// 2. Create product if enabled and price > 0
			let product: any = null
			if (
				input.createProduct &&
				input.pricing.price &&
				input.pricing.price > 0
			) {
				product = await courseBuilderAdapter.createProduct({
					name: input.cohort.title,
					price: input.pricing.price,
					quantityAvailable: -1,
					type: 'cohort',
					state: 'published',
					visibility: 'public',
				})

				if (product) {
					await tx.insert(contentResourceProduct).values({
						resourceId: cohortId,
						productId: product.id,
						position: 0,
						metadata: {
							addedBy: user.id,
						},
					})

					// Create coupon if enabled
					if (
						input.coupon?.enabled &&
						input.coupon.percentageDiscount &&
						input.coupon.expires
					) {
						const normalizeExpirationDate = (date: Date): Date => {
							const expireDate = new Date(date)
							expireDate.setHours(23, 59, 59, 999)
							return expireDate
						}

						const finalExpires = normalizeExpirationDate(input.coupon.expires)
						await courseBuilderAdapter.createCoupon({
							percentageDiscount: input.coupon.percentageDiscount,
							expires: finalExpires,
							restrictedToProductId: product.id,
							default: true,
							maxUses: -1,
							quantity: '-1',
							status: 1,
							fields: {},
						})
					}
				}
			}

			// 3. Link workshops to cohort
			let position = 0
			for (const workshop of input.workshops) {
				await tx.insert(contentResourceResource).values({
					resourceOfId: cohortId,
					resourceId: workshop.id,
					position,
				})
				position++
			}

			// 4. Index in TypeSense
			try {
				await upsertPostToTypeSense(parsedCohort.data, 'save')
				await log.info('cohort.create.typesense.success', {
					cohortId,
					userId: user.id,
				})
			} catch (error) {
				await log.error('cohort.create.typesense.failed', {
					cohortId,
					error,
					userId: user.id,
				})
			}

			await log.info('cohort.created', {
				cohortId,
				title: input.cohort.title,
				workshopCount: input.workshops.length,
				hasProduct: !!product,
				userId: user.id,
			})

			return {
				cohort: parsedCohort.data,
			}
		})

		return result
	} catch (error) {
		await log.error('cohort.create.failed', {
			error,
			title: input.cohort.title,
			userId: user.id,
		})
		throw error
	}
}
