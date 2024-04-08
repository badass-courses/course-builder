import { and, eq } from 'drizzle-orm'
import { runBasicTests } from 'utils/adapter.js'
import { runFormatPricingTests } from 'utils/format-prices-for-product.test.js'
import { v4 } from 'uuid'

import { DrizzleAdapter } from '../../src/index.js'
import { fixtures } from '../fixtures.js'
import {
	accounts,
	db,
	merchantCoupon,
	prices,
	products,
	purchases,
	sessions,
	users,
	verificationTokens,
} from './schema.js'

runBasicTests({
	adapter: DrizzleAdapter(db),
	fixtures,
	db: {
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
	},
})

runFormatPricingTests({
	adapter: DrizzleAdapter(db),
	fixtures,
	db: {
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
		createProduct: async (product) => {
			await db.insert(products).values(product)
			await db.insert(prices).values({
				id: 'price-id',
				createdAt: new Date(),
				status: 1,
				productId: product.id,
				nickname: 'bah',
				unitAmount: '100',
			})
			await db.insert(merchantCoupon).values(fixtures?.coupon)
			return product
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
			await db
				.delete(merchantCoupon)
				.where(eq(merchantCoupon.id, fixtures?.coupon.id))
				.then((res) => res[0])
		},
	},
})
