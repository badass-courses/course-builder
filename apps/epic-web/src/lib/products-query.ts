'use server'

import { db } from '@/db'
import {
	contentResourceProduct,
	merchantPrice,
	merchantProduct,
	prices,
	products,
} from '@/db/schema'
import { env } from '@/env.mjs'
import { NewProduct } from '@/lib/products'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { and, eq, or, sql } from 'drizzle-orm'
import Stripe from 'stripe'
import { v4 } from 'uuid'

import {
	ContentResource,
	Product,
	productSchema,
} from '@coursebuilder/core/schemas'

if (!env.STRIPE_SECRET_TOKEN) {
	throw new Error('Stripe secret token not found')
}

const stripe = new Stripe(env.STRIPE_SECRET_TOKEN, {
	apiVersion: '2024-06-20',
})

export async function addResourceToProduct({
	resource,
	productId,
}: {
	resource: ContentResource
	productId: string
}) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const product = await db.query.products.findFirst({
		where: eq(products.id, productId),
		with: {
			resources: true,
		},
	})

	if (!product) {
		throw new Error(`Product not found for id (${productId})`)
	}

	await db.insert(contentResourceProduct).values({
		resourceId: resource.id,
		productId,
		position: product.resources.length || 0,
		metadata: {
			addedBy: user.id,
		},
	})

	return db.query.contentResourceProduct.findFirst({
		where: eq(contentResourceProduct.resourceId, resource.id),
		with: {
			resource: true,
			product: true,
		},
	})
}

export async function archiveProduct(productId: string) {
	const product = await db.query.products.findFirst({
		where: eq(products.id, productId),
		with: {
			price: true,
			resources: true,
		},
	})

	if (!product) {
		throw new Error(`Product not found for id (${productId})`)
	}

	await db
		.update(products)
		.set({ status: 0, name: `${product.name} (Archived)` })
		.where(eq(products.id, productId))

	await db
		.update(prices)
		.set({ status: 0, nickname: `${product.name} (Archived)` })
		.where(eq(prices.productId, productId))

	await db
		.update(merchantProduct)
		.set({ status: 0 })
		.where(eq(merchantProduct.productId, productId))

	await db
		.update(merchantPrice)
		.set({ status: 0 })
		.where(eq(merchantPrice.priceId, product.price.id))

	const currentMerchantProduct = await db.query.merchantProduct.findFirst({
		where: eq(merchantProduct.productId, productId),
	})

	if (!currentMerchantProduct || !currentMerchantProduct.identifier) {
		throw new Error(`Merchant product not found for id (${productId})`)
	}

	await stripe.products.update(currentMerchantProduct.identifier, {
		active: false,
	})

	const currentMerchantPrice = await db.query.merchantPrice.findFirst({
		where: eq(merchantPrice.priceId, product.price.id),
	})

	if (!currentMerchantPrice || !currentMerchantPrice.identifier) {
		throw new Error(`Merchant price not found for id (${productId})`)
	}

	await stripe.prices.update(currentMerchantPrice.identifier, {
		active: false,
	})

	return db.query.products.findFirst({
		where: eq(products.id, productId),
		with: {
			price: true,
		},
	})
}

export async function updateProduct(input: Product) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}
	const currentProduct = await db.query.products.findFirst({
		where: eq(products.id, input.id),
		with: {
			price: true,
		},
	})

	if (!currentProduct) {
		throw new Error(`Product not found`)
	}

	console.log({ currentProduct })

	const merchantProduct = await db.query.merchantProduct.findFirst({
		where: (merchantProduct, { eq }) => eq(merchantProduct.productId, input.id),
	})

	if (!merchantProduct || !merchantProduct.identifier) {
		throw new Error(`Merchant product not found`)
	}

	console.log({ merchantProduct })

	// TODO: handle upgrades

	const stripeProduct = await stripe.products.retrieve(
		merchantProduct.identifier,
	)

	const priceChanged =
		currentProduct.price.unitAmount.toString() !==
		input.price?.unitAmount.toString()

	if (priceChanged) {
		const currentMerchantPrice = await db.query.merchantPrice.findFirst({
			where: (merchantPrice, { eq }) =>
				eq(merchantPrice.merchantProductId, merchantProduct.id),
		})

		if (!currentMerchantPrice || !currentMerchantPrice.identifier) {
			throw new Error(`Merchant price not found`)
		}

		const currentStripePrice = await stripe.prices.retrieve(
			currentMerchantPrice.identifier,
		)

		const newStripePrice = await stripe.prices.create({
			product: stripeProduct.id,
			unit_amount: Math.floor(Number(input.price?.unitAmount || 0) * 100),
			currency: 'usd',
			metadata: {
				slug: input.fields.slug,
				addedBy: user?.email || user.id,
			},
			active: true,
		})

		await stripe.products.update(stripeProduct.id, {
			default_price: newStripePrice.id,
		})

		const newMerchantPriceId = `mprice_${v4()}`
		await db.insert(merchantPrice).values({
			id: newMerchantPriceId,
			merchantProductId: merchantProduct.id,
			merchantAccountId: merchantProduct.merchantAccountId,
			priceId: currentProduct.price.id,
			status: 1,
			identifier: newStripePrice.id,
		})

		if (currentMerchantPrice) {
			await db
				.update(merchantPrice)
				.set({
					status: 0,
				})
				.where(eq(merchantPrice.id, currentMerchantPrice.id))
		}

		await db
			.update(prices)
			.set({
				unitAmount: Math.floor(Number(input.price?.unitAmount || 0)).toString(),
				nickname: input.name,
			})
			.where(eq(prices.id, currentProduct.price.id))

		if (currentStripePrice) {
			await stripe.prices.update(currentStripePrice.id, {
				active: false,
			})
		}
	}

	const updatedStripeProduct = await stripe.products.update(stripeProduct.id, {
		name: input.name,
		active: true,
		metadata: {
			// TODO: Add image
			slug: input.fields.slug,
			lastUpdatedBy: user?.email || user.id,
		},
	})

	await db
		.update(products)
		.set({
			name: input.name,
			quantityAvailable: input.quantityAvailable,
			status: input.fields.state === 'published' ? 1 : 0,
			fields: {
				...input.fields,
			},
		})
		.where(eq(products.id, currentProduct.id))

	return db.query.products.findFirst({
		where: eq(products.id, currentProduct.id),
		with: {
			price: true,
		},
	})
}

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
			resources: {
				with: {
					resource: {
						with: {
							resources: true,
						},
					},
				},
			},
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
