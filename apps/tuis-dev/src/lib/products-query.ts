'use server'

import { cache } from 'react'
import { stripeProvider } from '@/coursebuilder/stripe-provider'
import { courseBuilderAdapter, db } from '@/db'
import {
	contentResourceProduct,
	merchantPrice,
	merchantProduct,
	prices,
	products,
} from '@/db/schema'
import { NewProduct } from '@/lib/products'
import { getServerAuthSession } from '@/server/auth'
import { and, eq } from 'drizzle-orm'
import { v4 } from 'uuid'
import { z } from 'zod'

import {
	ContentResource,
	Product,
	productSchema,
} from '@coursebuilder/core/schemas'

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

	const product = await courseBuilderAdapter.getProduct(productId)

	if (!product) {
		throw new Error(`Product not found for id (${productId})`)
	}

	await db.insert(contentResourceProduct).values({
		resourceId: resource.id,
		productId,
		position: product.resources?.length || 0,
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
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}
	return courseBuilderAdapter.archiveProduct(productId)
}

export async function getActiveSelfPacedProducts() {
	return db.query.products.findMany({
		where: (products, { eq, and }) =>
			and(eq(products.status, 1), eq(products.type, 'self-paced')),
	})
}

export async function updateProduct(input: Product) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}
	return courseBuilderAdapter.updateProduct(input)
}

/**
 * Gets a product by slug or ID.
 * Cached per-request to prevent duplicate database queries.
 */
export const getProduct = cache(async function getProductImpl(
	productSlugOrId?: string,
) {
	return courseBuilderAdapter.getProduct(productSlugOrId)
})

export async function getProducts() {
	const productsData = await db.query.products.findMany({
		where: eq(products.status, 1),
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

	const parsedProducts = z.array(productSchema).safeParse(productsData)
	if (!parsedProducts.success) {
		console.error(
			'Error parsing products',
			JSON.stringify(parsedProducts.error),
			JSON.stringify(productsData),
		)
		return []
	}
	return parsedProducts.data
}

export async function createProduct(input: NewProduct) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	return courseBuilderAdapter.createProduct(input)
}

export async function getProductForResource(resourceId: string) {
	const product = await db.query.contentResourceProduct.findFirst({
		where: eq(contentResourceProduct.resourceId, resourceId),
		with: {
			product: true,
		},
	})
	return product?.product
}
