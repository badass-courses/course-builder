import { and, eq, sql } from 'drizzle-orm'
import { mysqlTable } from 'drizzle-orm/mysql-core'
import { runBasicTests } from 'utils/adapter.js'
import { runFormatPricingTests } from 'utils/format-prices-for-product.test.js'
import { v4 } from 'uuid'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { MockStripeProvider } from '@coursebuilder/core/providers/stripe'
import { priceSchema, Product } from '@coursebuilder/core/schemas'

import { DrizzleAdapter } from '../../src/index.js'
import { fixtures } from '../fixtures.js'
import {
	accounts,
	contentResource,
	contentResourceProduct,
	contentResourceResource,
	coupon,
	db,
	merchantAccount,
	merchantCoupon,
	prices,
	products,
	purchases,
	sessions,
	upgradableProducts,
	users,
	verificationTokens,
} from './schema.js'

runBasicTests({
	adapter: DrizzleAdapter(db, mysqlTable, MockStripeProvider),
	fixtures,
	db: {
		connect: async () => {
			await Promise.all([
				db.delete(sessions),
				db.delete(accounts),
				db.delete(verificationTokens),
				db.delete(users),
				db.delete(purchases),
				db.delete(merchantCoupon),
				db.delete(coupon),
				db.delete(products),
			])
		},
		disconnect: async () => {
			await Promise.all([
				db.delete(sessions),
				db.delete(accounts),
				db.delete(verificationTokens),
				db.delete(users),
				db.delete(purchases),
				db.delete(merchantCoupon),
				db.delete(coupon),
				db.delete(products),
			])
		},
		purchase: async (id) => {
			const purchase = await db
				.select()
				.from(purchases)
				.where(eq(purchases.id, id))
				.then((res) => res[0] ?? null)
			return purchase
		},
		user: async (id) => {
			const user = await db
				.select()
				.from(users)
				.where(eq(users.id, id))
				.then((res) => res[0] ?? null)
			return user
		},
		session: async (sessionToken) => {
			const session = await db
				.select()
				.from(sessions)
				.where(eq(sessions.sessionToken, sessionToken))
				.then((res) => res[0] ?? null)

			return session
		},
		account: (provider_providerAccountId) => {
			const account = db
				.select()
				.from(accounts)
				.where(
					eq(
						accounts.providerAccountId,
						provider_providerAccountId.providerAccountId,
					),
				)
				.then((res) => res[0] ?? null)
			return account
		},
		verificationToken: (identifier_token) =>
			db
				.select()
				.from(verificationTokens)
				.where(
					and(
						eq(verificationTokens.token, identifier_token.token),
						eq(verificationTokens.identifier, identifier_token.identifier),
					),
				)
				.then((res) => res[0]) ?? null,
	},
})

runFormatPricingTests({
	adapter: DrizzleAdapter(db, mysqlTable, MockStripeProvider),
	fixtures,
	db: {
		createStandardMerchantCoupons: async () => {
			for (const coupon of fixtures.standardMerchantCoupons) {
				await db.insert(merchantCoupon).values(coupon)
			}
		},
		connect: async () => {
			await Promise.all([
				db.delete(sessions),
				db.delete(accounts),
				db.delete(verificationTokens),
				db.delete(users),
				db.delete(purchases),
			])
		},
		disconnect: async () => {
			await Promise.all([
				db.delete(sessions),
				db.delete(accounts),
				db.delete(verificationTokens),
				db.delete(users),
				db.delete(purchases),
			])
		},
		purchase: async (id) => {
			const purchase = await db
				.select()
				.from(purchases)
				.where(eq(purchases.id, id))
				.then((res) => res[0] ?? null)
			return purchase
		},
		user: async (id) => {
			const user = await db
				.select()
				.from(users)
				.where(eq(users.id, id))
				.then((res) => res[0] ?? null)
			return user
		},
		session: async (sessionToken) => {
			const session = await db
				.select()
				.from(sessions)
				.where(eq(sessions.sessionToken, sessionToken))
				.then((res) => res[0] ?? null)

			return session
		},
		account: (provider_providerAccountId) => {
			const account = db
				.select()
				.from(accounts)
				.where(
					eq(
						accounts.providerAccountId,
						provider_providerAccountId.providerAccountId,
					),
				)
				.then((res) => res[0] ?? null)
			return account
		},
		verificationToken: (identifier_token) =>
			db
				.select()
				.from(verificationTokens)
				.where(
					and(
						eq(verificationTokens.token, identifier_token.token),
						eq(verificationTokens.identifier, identifier_token.identifier),
					),
				)
				.then((res) => res[0]) ?? null,
		createProduct: async (
			product: any,
			price = {
				createdAt: new Date(),
				status: 1,
				productId: product.id,
				nickname: 'bah',
				unitAmount: '100',
			},
		) => {
			const priceId = v4()
			await db.insert(products).values(product)
			await db.insert(prices).values({
				id: price.id || priceId,
				...price,
			})

			const newPrice = await db.query.prices.findFirst({
				where: eq(prices.id, priceId),
			})

			const newProduct = await db.query.products.findFirst({
				where: eq(products.id, product.id),
			})

			return { product: newProduct, price: newPrice }
		},
		deleteProduct: async (productId) => {
			await db
				.delete(products)
				.where(eq(products.id, productId))
				.then((res) => res[0])
			await db
				.delete(prices)
				.where(eq(prices.productId, productId))
				.then((res) => res[0])
		},
		createCoupon: async (newCoupon) => {
			await db.insert(coupon).values(newCoupon)
			return db.query.coupon.findFirst({
				where: eq(coupon.id, newCoupon.id),
			})
		},
		createMerchantCoupon: async (newCoupon) => {
			await db.insert(merchantCoupon).values(newCoupon)
			return merchantCoupon
		},
		deleteMerchantCoupons: async () => {
			await db.delete(merchantCoupon)
			await db.delete(coupon)
		},
		deleteMerchantCoupon: async (id) => {
			await db.delete(merchantCoupon).where(eq(merchantCoupon.id, id))
		},
		createPurchase: async (purchase) => {
			await db.insert(purchases).values(purchase)
			return db.query.purchases.findFirst({
				where: eq(purchases.id, purchase.id),
			})
		},
		getPriceForProduct: async (productId) => {
			const price = await db.query.prices.findFirst({
				where: eq(prices.productId, productId),
			})

			return priceSchema.nullable().parse(price)
		},
		deletePurchases: async () => {
			await db.delete(purchases)
		},
		createUpgradableProduct: async (upgradableFromId, upgradableToId) => {
			await db.insert(upgradableProducts).values({
				upgradableFromId,
				upgradableToId,
			})
		},
	},
})

const adapter = DrizzleAdapter(db, mysqlTable, MockStripeProvider)

describe('createCohort', () => {
	beforeEach(async () => {
		await db.delete(contentResourceProduct)
		await db.delete(contentResourceResource)
		await db.delete(contentResource)
		await db.delete(merchantCoupon)
		await db.delete(prices)
		await db.delete(products)
		await db.delete(coupon)
		await db.delete(merchantAccount)
		await db.delete(users)

		// Create merchant account needed for product creation
		await db.insert(merchantAccount).values({
			id: 'merchant-account-test',
			label: 'stripe',
			identifier: 'acct_test123',
			status: 1,
		})

		// Create merchant coupons needed for coupon creation
		for (const mc of fixtures.standardMerchantCoupons) {
			await db.insert(merchantCoupon).values(mc)
		}
	})

	afterEach(async () => {
		await db.delete(contentResourceProduct)
		await db.delete(contentResourceResource)
		await db.delete(contentResource)
		await db.delete(merchantCoupon)
		await db.delete(prices)
		await db.delete(products)
		await db.delete(coupon)
		await db.delete(merchantAccount)
	})

	it('creates cohort without product when createProduct is false', async () => {
		const userId = v4()
		await db.insert(users).values({ ...fixtures.user, id: userId })

		const input = {
			cohort: { title: 'My Cohort' },
			dates: {
				start: new Date('2025-01-01T00:00:00.000Z'),
				end: new Date('2025-03-01T00:00:00.000Z'),
			},
			createProduct: false,
			pricing: { price: null },
			workshops: [],
		}

		const result = await adapter.createCohort(input, userId)

		expect(result.cohort).toBeDefined()
		expect(result.cohort.id).toContain('cohort~')
		expect(result.cohort.fields?.title).toBe('My Cohort')
		expect(result.cohort.fields?.startsAt).toBe('2025-01-01T00:00:00.000Z')
		expect(result.cohort.fields?.endsAt).toBe('2025-03-01T00:00:00.000Z')
		expect(result.product).toBeNull()
	})

	it('creates cohort with product when createProduct is true and price > 0', async () => {
		const userId = v4()
		await db.insert(users).values({ ...fixtures.user, id: userId })

		const input = {
			cohort: { title: 'Paid Cohort' },
			dates: {
				start: new Date('2025-01-01T00:00:00.000Z'),
				end: new Date('2025-03-01T00:00:00.000Z'),
			},
			createProduct: true,
			pricing: { price: 250 },
			workshops: [],
		}

		const result = await adapter.createCohort(input, userId)

		expect(result.cohort).toBeDefined()
		expect(result.product).toBeDefined()
		expect(result.product.name).toBe('Paid Cohort')

		// Verify product link exists
		const productLink = await db.query.contentResourceProduct.findFirst({
			where: eq(contentResourceProduct.resourceId, result.cohort.id),
		})
		expect(productLink).toBeDefined()
		expect(productLink?.productId).toBe(result.product.id)
	})

	it('links workshops to cohort with correct positions', async () => {
		const userId = v4()
		await db.insert(users).values({ ...fixtures.user, id: userId })

		// Create test workshops
		const workshop1Id = `workshop~${v4()}`
		const workshop2Id = `workshop~${v4()}`
		await db.insert(contentResource).values([
			{
				id: workshop1Id,
				type: 'workshop',
				createdById: userId,
				fields: {
					title: 'Workshop 1',
					slug: 'workshop-1',
					state: 'draft',
					visibility: 'unlisted',
				},
			},
			{
				id: workshop2Id,
				type: 'workshop',
				createdById: userId,
				fields: {
					title: 'Workshop 2',
					slug: 'workshop-2',
					state: 'draft',
					visibility: 'unlisted',
				},
			},
		])

		const input = {
			cohort: { title: 'Cohort with Workshops' },
			dates: {
				start: new Date('2025-01-01T00:00:00.000Z'),
				end: new Date('2025-03-01T00:00:00.000Z'),
			},
			createProduct: false,
			pricing: { price: null },
			workshops: [{ id: workshop1Id }, { id: workshop2Id }],
		}

		const result = await adapter.createCohort(input, userId)

		// Verify workshop links
		const workshopLinks = await db.query.contentResourceResource.findMany({
			where: eq(contentResourceResource.resourceOfId, result.cohort.id),
			orderBy: (table, { asc }) => [asc(table.position)],
		})
		expect(workshopLinks).toHaveLength(2)
		expect(workshopLinks[0]?.resourceId).toBe(workshop1Id)
		expect(workshopLinks[0]?.position).toBe(0)
		expect(workshopLinks[1]?.resourceId).toBe(workshop2Id)
		expect(workshopLinks[1]?.position).toBe(1)
	})
})

describe('createWorkshop', () => {
	beforeEach(async () => {
		await db.delete(contentResourceProduct)
		await db.delete(contentResourceResource)
		await db.delete(contentResource)
		await db.delete(merchantCoupon)
		await db.delete(prices)
		await db.delete(products)
		await db.delete(coupon)
		await db.delete(merchantAccount)
		await db.delete(users)

		// Create merchant account needed for product creation
		await db.insert(merchantAccount).values({
			id: 'merchant-account-test',
			label: 'stripe',
			identifier: 'acct_test123',
			status: 1,
		})

		// Create merchant coupons needed for coupon creation
		for (const mc of fixtures.standardMerchantCoupons) {
			await db.insert(merchantCoupon).values(mc)
		}
	})

	afterEach(async () => {
		await db.delete(contentResourceProduct)
		await db.delete(contentResourceResource)
		await db.delete(contentResource)
		await db.delete(merchantCoupon)
		await db.delete(prices)
		await db.delete(products)
		await db.delete(coupon)
		await db.delete(merchantAccount)
	})

	it('creates workshop without product when price is 0', async () => {
		const userId = v4()
		await db.insert(users).values({ ...fixtures.user, id: userId })

		const input = {
			workshop: { title: 'My Workshop' },
			pricing: { price: 0, quantity: null },
			structure: [],
		}

		const result = await adapter.createWorkshop(input, userId)

		expect(result.workshop).toBeDefined()
		expect(result.workshop.id).toContain('workshop~')
		expect(result.workshop.fields?.title).toBe('My Workshop')
		expect(result.product).toBeNull()
		expect(result.sections).toHaveLength(0)
		expect(result.lessons).toHaveLength(0)
	})

	it('creates workshop with product when price > 0', async () => {
		const userId = v4()
		await db.insert(users).values({ ...fixtures.user, id: userId })

		const input = {
			workshop: { title: 'Paid Workshop' },
			createProduct: true,
			pricing: { price: 250, quantity: -1 },
			structure: [],
		}

		const result = await adapter.createWorkshop(input, userId)

		expect(result.workshop).toBeDefined()
		expect(result.product).toBeDefined()
		expect(result.product.name).toBe('Paid Workshop')

		// Verify product link exists
		const productLink = await db.query.contentResourceProduct.findFirst({
			where: eq(contentResourceProduct.resourceId, result.workshop.id),
		})
		expect(productLink).toBeDefined()
		expect(productLink?.productId).toBe(result.product.id)
	})

	it('creates lessons at root level', async () => {
		const userId = v4()
		await db.insert(users).values({ ...fixtures.user, id: userId })

		const input = {
			workshop: { title: 'Workshop with Lessons' },
			pricing: { price: 0, quantity: null },
			structure: [
				{ type: 'lesson' as const, title: 'Lesson 1' },
				{ type: 'lesson' as const, title: 'Lesson 2' },
			],
		}

		const result = await adapter.createWorkshop(input, userId)

		expect(result.lessons).toHaveLength(2)
		expect(result.lessons[0]?.fields?.title).toBe('Lesson 1')
		expect(result.lessons[1]?.fields?.title).toBe('Lesson 2')

		// Verify lessons are linked to workshop
		const lessonLinks = await db.query.contentResourceResource.findMany({
			where: eq(contentResourceResource.resourceOfId, result.workshop.id),
			orderBy: (table, { asc }) => [asc(table.position)],
		})
		expect(lessonLinks).toHaveLength(2)
		expect(lessonLinks[0]?.position).toBe(0)
		expect(lessonLinks[1]?.position).toBe(1)
	})

	it('creates sections with nested lessons', async () => {
		const userId = v4()
		await db.insert(users).values({ ...fixtures.user, id: userId })

		const input = {
			workshop: { title: 'Workshop with Sections' },
			pricing: { price: 0, quantity: null },
			structure: [
				{
					type: 'section' as const,
					title: 'Section 1',
					lessons: [{ title: 'Lesson 1.1' }, { title: 'Lesson 1.2' }],
				},
				{
					type: 'section' as const,
					title: 'Section 2',
					lessons: [{ title: 'Lesson 2.1' }],
				},
			],
		}

		const result = await adapter.createWorkshop(input, userId)

		expect(result.sections).toHaveLength(2)
		expect(result.sections[0]?.fields?.title).toBe('Section 1')
		expect(result.sections[1]?.fields?.title).toBe('Section 2')
		expect(result.lessons).toHaveLength(3)

		// Verify section links to workshop
		const sectionLinks = await db.query.contentResourceResource.findMany({
			where: eq(contentResourceResource.resourceOfId, result.workshop.id),
		})
		expect(sectionLinks).toHaveLength(2)

		// Verify lessons are linked to sections
		const section1Lessons = await db.query.contentResourceResource.findMany({
			where: eq(contentResourceResource.resourceOfId, result.sections[0]!.id),
			orderBy: (table, { asc }) => [asc(table.position)],
		})
		expect(section1Lessons).toHaveLength(2)
		expect(section1Lessons[0]?.position).toBe(0)
		expect(section1Lessons[1]?.position).toBe(1)
	})

	it('handles mix of sections and root-level lessons', async () => {
		const userId = v4()
		await db.insert(users).values({ ...fixtures.user, id: userId })

		const input = {
			workshop: { title: 'Mixed Structure' },
			pricing: { price: 0, quantity: null },
			structure: [
				{ type: 'lesson' as const, title: 'Root Lesson 1' },
				{
					type: 'section' as const,
					title: 'Section 1',
					lessons: [{ title: 'Nested Lesson 1' }],
				},
				{ type: 'lesson' as const, title: 'Root Lesson 2' },
			],
		}

		const result = await adapter.createWorkshop(input, userId)

		expect(result.sections).toHaveLength(1)
		expect(result.lessons).toHaveLength(3) // 2 root + 1 nested

		// Verify workshop has 3 direct children (2 lessons + 1 section)
		const workshopChildren = await db.query.contentResourceResource.findMany({
			where: eq(contentResourceResource.resourceOfId, result.workshop.id),
		})
		expect(workshopChildren).toHaveLength(3)
	})

	it('links videos to lessons when videoResourceId provided', async () => {
		const userId = v4()
		await db.insert(users).values({ ...fixtures.user, id: userId })

		// Create video resource
		const videoId = `video~${v4()}`
		await db.insert(contentResource).values({
			id: videoId,
			type: 'videoResource',
			createdById: userId,
			fields: { state: 'ready' },
		})

		const input = {
			workshop: { title: 'Workshop with Video' },
			pricing: { price: 0, quantity: null },
			structure: [
				{
					type: 'lesson' as const,
					title: 'Video Lesson',
					videoResourceId: videoId,
				},
			],
		}

		const result = await adapter.createWorkshop(input, userId)

		expect(result.lessons).toHaveLength(1)

		// Verify video is linked to lesson
		const videoLink = await db.query.contentResourceResource.findFirst({
			where: and(
				eq(contentResourceResource.resourceOfId, result.lessons[0]!.id),
				eq(contentResourceResource.resourceId, videoId),
			),
		})
		expect(videoLink).toBeDefined()
		expect(videoLink?.position).toBe(0)
	})
})
