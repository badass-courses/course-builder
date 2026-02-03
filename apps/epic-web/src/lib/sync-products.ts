'use server'

import type { table } from 'console'
import { db } from '@/db'
import { merchantPrice, merchantProduct, prices, products } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import {
	decimal,
	index,
	int,
	json,
	mysqlTable,
	primaryKey,
	timestamp,
	unique,
	varchar,
} from 'drizzle-orm/mysql-core'

// Original tables (no prefix)
const originalProduct = mysqlTable(
	'Product',
	{
		id: varchar('id', { length: 191 }).notNull(),

		name: varchar('name', { length: 191 }).notNull(),
		key: varchar('key', { length: 191 }),

		createdAt: timestamp('createdAt', { mode: 'date', fsp: 3 })
			.default(sql`CURRENT_TIMESTAMP(3)`)
			.notNull(),
		status: int('status').default(0).notNull(),
		quantityAvailable: int('quantityAvailable').default(-1).notNull(),
		productType: varchar('productType', { length: 191 }),
	},
	(table) => {
		return {
			productId: primaryKey({ columns: [table.id], name: 'Product_id' }),
		}
	},
)

const originalMerchantProduct = mysqlTable(
	'MerchantProduct',
	{
		id: varchar('id', { length: 191 }).notNull(),

		merchantAccountId: varchar('merchantAccountId', { length: 191 }).notNull(),
		productId: varchar('productId', { length: 191 }).notNull(),
		status: int('status').default(0).notNull(),
		identifier: varchar('identifier', { length: 191 }),
		createdAt: timestamp('createdAt', { mode: 'date', fsp: 3 })
			.default(sql`CURRENT_TIMESTAMP(3)`)
			.notNull(),
	},
	(table) => {
		return {
			merchantProductId: primaryKey({
				columns: [table.id],
				name: 'MerchantProduct_id',
			}),
			merchantProductIdentifierKey: unique('MerchantProduct_identifier_key').on(
				table.identifier,
			),
		}
	},
)

const originalMerchantPrice = mysqlTable(
	'MerchantPrice',
	{
		id: varchar('id', { length: 191 }).notNull(),

		merchantAccountId: varchar('merchantAccountId', { length: 191 }).notNull(),
		merchantProductId: varchar('merchantProductId', { length: 191 }).notNull(),
		status: int('status').default(0),
		identifier: varchar('identifier', { length: 191 }),
		createdAt: timestamp('createdAt', { mode: 'date', fsp: 3 })
			.default(sql`CURRENT_TIMESTAMP(3)`)
			.notNull(),
		priceId: varchar('priceId', { length: 191 }),
	},
	(table) => {
		return {
			merchantPriceId: primaryKey({
				columns: [table.id],
				name: 'MerchantPrice_id',
			}),
			merchantPriceIdentifierKey: unique('MerchantPrice_identifier_key').on(
				table.identifier,
			),
		}
	},
)

const originalPrice = mysqlTable(
	'Price',
	{
		id: varchar('id', { length: 191 }).notNull(),
		productId: varchar('productId', { length: 191 }),
		nickname: varchar('nickname', { length: 191 }),
		status: int('status').default(0).notNull(),
		unitAmount: decimal('unitAmount', { precision: 10, scale: 2 }).notNull(),
		createdAt: timestamp('createdAt', { mode: 'date', fsp: 3 })
			.default(sql`CURRENT_TIMESTAMP(3)`)
			.notNull(),
	},
	(table) => {
		return {
			priceId: primaryKey({ columns: [table.id], name: 'Price_id' }),
			productIdIdx: index('productId_idx').on(table.productId),
		}
	},
)
/**
 * Sync all products from zEW_Product to Product (no prefix)
 * Uses UPSERT pattern - inserts new, updates existing
 */
export async function syncProductsToOriginal() {
	// Get all products from prefixed table
	const prefixedProducts = await db.query.products.findMany()

	const results = {
		synced: 0,
		errors: [] as string[],
	}

	for (const product of prefixedProducts) {
		try {
			await db
				.insert(originalProduct)
				.values({
					id: product.id,

					name: product.name,
					key: product.key,

					createdAt: product.createdAt,
					status: product.status,
					quantityAvailable: product.quantityAvailable,
					productType: product.type,
				})
				.onDuplicateKeyUpdate({
					set: {
						name: product.name,
						key: product.key,

						status: product.status,
						quantityAvailable: product.quantityAvailable,
						productType: product.type,
					},
				})
			results.synced++
		} catch (error) {
			results.errors.push(
				`Failed to sync product ${product.id}: ${error instanceof Error ? error.message : String(error)}`,
			)
		}
	}

	return results
}

/**
 * Sync a single product by ID (includes Product, MerchantProduct, MerchantPrice)
 */
export async function syncProductToOriginal(productId: string) {
	const product = await db.query.products.findFirst({
		where: eq(products.id, productId),
	})

	if (!product) {
		throw new Error(`Product not found: ${productId}`)
	}

	// Sync Product
	await db
		.insert(originalProduct)
		.values({
			id: product.id,

			name: product.name,
			key: product.key,

			createdAt: product.createdAt,
			status: product.status,
			quantityAvailable: product.quantityAvailable,
			productType: product.type,
		})
		.onDuplicateKeyUpdate({
			set: {
				name: product.name,
				key: product.key,

				status: product.status,
				quantityAvailable: product.quantityAvailable,
				productType: product.type,
			},
		})

	// Sync MerchantProduct
	const mp = await db.query.merchantProduct.findFirst({
		where: eq(merchantProduct.productId, productId),
	})
	if (mp) {
		await db
			.insert(originalMerchantProduct)
			.values({
				id: mp.id,

				merchantAccountId: mp.merchantAccountId,
				productId: mp.productId,
				status: mp.status,
				identifier: mp.identifier,
				createdAt: mp.createdAt,
			})
			.onDuplicateKeyUpdate({
				set: {
					merchantAccountId: mp.merchantAccountId,
					productId: mp.productId,
					status: mp.status,
					identifier: mp.identifier,
				},
			})

		// Sync MerchantPrice (linked via merchantProductId)
		const mprice = await db.query.merchantPrice.findFirst({
			where: eq(merchantPrice.merchantProductId, mp.id),
		})
		if (mprice) {
			await db
				.insert(originalMerchantPrice)
				.values({
					id: mprice.id,
					merchantAccountId: mprice.merchantAccountId,
					merchantProductId: mprice.merchantProductId,
					status: mprice.status,
					identifier: mprice.identifier,
					createdAt: mprice.createdAt,
					priceId: mprice.priceId,
				})
				.onDuplicateKeyUpdate({
					set: {
						merchantAccountId: mprice.merchantAccountId,
						merchantProductId: mprice.merchantProductId,
						status: mprice.status,
						identifier: mprice.identifier,
						priceId: mprice.priceId,
					},
				})
		}
		const originalPrices = await db.query.prices.findMany({
			where: eq(prices.productId, productId),
		})
		for (const price of originalPrices) {
			await db
				.insert(originalPrice)
				.values({
					id: price.id,
					productId: price.productId,
					nickname: price.nickname,
					status: price.status,
					unitAmount: price.unitAmount,
					createdAt: price.createdAt,
				})
				.onDuplicateKeyUpdate({
					set: {
						nickname: price.nickname,
						status: price.status,
						unitAmount: price.unitAmount,
					},
				})
		}
	}

	return { synced: true, productId }
}
