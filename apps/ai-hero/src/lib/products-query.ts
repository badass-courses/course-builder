'use server'

import { stripeProvider } from '@/coursebuilder/stripe-provider'
import { courseBuilderAdapter, db } from '@/db'
import {
	contentResourceProduct,
	contentResourceResource,
	merchantPrice,
	merchantProduct,
	prices,
	products,
} from '@/db/schema'
import { NewProduct } from '@/lib/products'
import { getServerAuthSession } from '@/server/auth'
import { and, asc, eq, or, sql } from 'drizzle-orm'
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

export async function getProduct(productSlugOrId?: string) {
	return courseBuilderAdapter.getProduct(productSlugOrId)
}

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

/**
 * Retrieves a product with its full nested content structure
 * Product → Cohort/Workshop → Sections → Lessons → Solutions
 * @param productSlugOrId - The product ID or slug to look up
 * @returns The product with full nested structure, or null if not found
 */
export async function getProductWithFullStructure(productSlugOrId: string) {
	const productData = await db.query.products.findFirst({
		where: or(
			eq(products.id, productSlugOrId),
			eq(sql`JSON_EXTRACT(${products.fields}, "$.slug")`, productSlugOrId),
		),
		with: {
			price: true,
			resources: {
				with: {
					resource: {
						// cohort or workshop level
						with: {
							resources: {
								// workshops (if cohort) or sections (if workshop)
								with: {
									resource: {
										with: {
											resources: {
												// sections (if workshop under cohort) or lessons
												with: {
													resource: {
														with: {
															resources: {
																// lessons or solutions
																with: {
																	resource: true,
																},
																orderBy: [
																	asc(contentResourceResource.position),
																],
															},
														},
													},
												},
												orderBy: [asc(contentResourceResource.position)],
											},
										},
									},
								},
								orderBy: [asc(contentResourceResource.position)],
							},
						},
					},
				},
			},
		},
	})

	if (!productData) {
		return null
	}

	const parsedProduct = productSchema.safeParse(productData)
	if (!parsedProduct.success) {
		console.error('Error parsing product:', {
			errors: parsedProduct.error.errors,
			productId: productSlugOrId,
		})
		return null
	}

	return parsedProduct.data
}

/**
 * Retrieves all products with their full nested content structure
 * @returns Array of products with full nested structure
 */
export async function getProductsWithFullStructure() {
	const productsData = await db.query.products.findMany({
		where: eq(products.status, 1),
		with: {
			price: true,
			resources: {
				with: {
					resource: {
						// cohort or workshop level
						with: {
							resources: {
								// workshops (if cohort) or sections (if workshop)
								with: {
									resource: {
										with: {
											resources: {
												// sections (if workshop under cohort) or lessons
												with: {
													resource: {
														with: {
															resources: {
																// lessons or solutions
																with: {
																	resource: true,
																},
																orderBy: [
																	asc(contentResourceResource.position),
																],
															},
														},
													},
												},
												orderBy: [asc(contentResourceResource.position)],
											},
										},
									},
								},
								orderBy: [asc(contentResourceResource.position)],
							},
						},
					},
				},
			},
		},
	})

	const parsedProducts = z.array(productSchema).safeParse(productsData)
	if (!parsedProducts.success) {
		console.error('Error parsing products:', {
			errors: parsedProducts.error.errors,
		})
		return []
	}

	return parsedProducts.data
}
