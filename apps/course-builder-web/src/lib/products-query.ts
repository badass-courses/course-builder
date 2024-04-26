'use server'

import { db } from '@/db'
import { merchantPrice, merchantProduct, prices, products } from '@/db/schema'
import { env } from '@/env.mjs'
import { NewProduct } from '@/lib/products'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { and, eq, or, sql } from 'drizzle-orm'
import Stripe from 'stripe'
import { v4 } from 'uuid'

import { productSchema } from '@coursebuilder/core/schemas'

if (!env.STRIPE_SECRET_TOKEN) {
	throw new Error('Stripe secret token not found')
}

const stripe = new Stripe(env.STRIPE_SECRET_TOKEN, {
	apiVersion: '2020-08-27',
})

export async function getProduct(productSlugOrId: string) {
	const productData = await db.query.products.findFirst({
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
		},
	})

	const parsedProduct = productSchema.safeParse(productData)
	if (!parsedProduct.success) {
		console.error('Error parsing product', productData)
		return null
	}
	return parsedProduct.data
}

export async function createProduct(input: NewProduct) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const merchantAccount = await db.query.merchantAccount.findFirst({
		where: (merchantAccount, { eq }) => eq(merchantAccount.label, 'stripe'),
	})

	if (!merchantAccount) {
		throw new Error('Merchant account not found')
	}

	const hash = guid()
	const newProductId = slugify(`product-${hash}`)

	const newProduct = {
		id: newProductId,
		name: input.name,
		status: 1,
		fields: {
			state: 'draft',
			visibility: 'unlisted',
			slug: slugify(`${input.name}-${hash}`),
		},
	}

	await db.insert(products).values(newProduct)

	const priceHash = guid()
	const newPriceId = `price-${priceHash}`

	await db.insert(prices).values({
		id: newPriceId,
		productId: newProductId,
		unitAmount: input.price.toString(),
		status: 1,
	})

	const product = await db.query.products.findFirst({
		where: eq(products.id, newProductId),
		with: {
			price: true,
		},
	})

	const stripeProduct = await stripe.products.create({
		name: input.name,
		metadata: {
			slug: product?.fields?.slug,
		},
	})

	const stripePrice = await stripe.prices.create({
		product: stripeProduct.id,
		unit_amount: Math.floor(Number(input.price) * 100),
		currency: 'usd',
		nickname: input.name,
		metadata: {
			slug: product?.fields?.slug,
		},
	})

	const newMerchantProductId = `mproduct_${v4()}`

	await db.insert(merchantProduct).values({
		id: newMerchantProductId,
		merchantAccountId: merchantAccount.id,
		productId: newProductId,
		identifier: stripeProduct.id,
		status: 1,
	})

	const newMerchantPriceId = `mprice_${v4()}`
	await db.insert(merchantPrice).values({
		id: newMerchantPriceId,
		merchantAccountId: merchantAccount.id,
		merchantProductId: newMerchantProductId,
		priceId: newPriceId,
		identifier: stripePrice.id,
		status: 1,
	})

	// TODO: handle upgrades

	const parsedProduct = productSchema.safeParse(product)
	if (!parsedProduct.success) {
		console.error('Error parsing resource', product)
		throw new Error('Error parsing resource')
	}
	return parsedProduct.data
}
