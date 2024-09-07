import { and, eq, sql } from 'drizzle-orm'
import { mysqlTable } from 'drizzle-orm/mysql-core'
import { runBasicTests } from 'utils/adapter.js'
import { runFormatPricingTests } from 'utils/format-prices-for-product.test.js'
import { v4 } from 'uuid'

import { MockStripeProvider } from '@coursebuilder/core/providers/stripe'
import { priceSchema, Product } from '@coursebuilder/core/schemas'

import { DrizzleAdapter } from '../../src/index.js'
import { fixtures } from '../fixtures.js'
import {
	accounts,
	coupon,
	db,
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
