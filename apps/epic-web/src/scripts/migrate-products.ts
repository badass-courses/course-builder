import { courseBuilderAdapter, db } from '@/db'
import {
	contentResourceProduct,
	products,
	upgradableProducts,
} from '@/db/schema'
import { addResourceToProduct } from '@/lib/products-query'
import { writeContributionTypes } from '@/scripts/controbution-types'
import { sanityQuery } from '@/scripts/utils/sanity-client'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

await writeContributionTypes()

export const SanityProductSchema = z.object({
	_id: z.string(),
	_type: z.string(),
	_updatedAt: z.string(),
	_createdAt: z.string(),
	title: z.string(),
	description: z.string().nullable(),
	slug: z.string(),
	image: z
		.object({
			url: z.string(),
			alt: z.string().optional(),
		})
		.optional(),
	ogImage: z.string().optional().nullable(),
	features: z
		.array(
			z.object({
				icon: z.string(),
				value: z.string(),
			}),
		)
		.optional()
		.nullable(),
	productId: z.string().optional(),
	body: z.nullable(z.string()).optional(),
	type: z.enum(['live', 'self-paced', 'membership']),
	state: z.enum(['draft', 'active', 'unavailable', 'archived']),
	modules: z.array(z.any()).optional(),
	upgradableTo: z.array(z.any()).default([]),
	welcomeVideo: z
		.object({
			muxPlaybackId: z.string(),
			poster: z.string().optional().nullable(),
		})
		.nullable(),
})

export type SanityProduct = z.infer<typeof SanityProductSchema>

export async function migrateProducts(WRITE_TO_DB: boolean = true) {
	const sanityProducts = await sanityQuery<
		SanityProduct[]
	>(`*[_type == "product"] {
        _id,
        _type,
        _updatedAt,
        _createdAt,
        productId,
        title,
        description,
        type,
        image,
        ogImage,
        state,
        type,
        "slug": slug.current,
        features,
        body,
        "welcomeVideo": welcomeVideo->{"muxPlaybackId":muxAsset.muxPlaybackId, poster},
        upgradableTo[]->{
          ...,
          modules[]->{
            ...,
            "description": "",
            "image": image.asset->{url},
          }
        },
        modules[]->{
          ...,
          "image": image.asset->{url},
          "instructors": contributors[@.role == 'instructor'].contributor->{
              ...,
              "slug": slug.current,
          },
        }
  }`)

	for (const sanityProduct of sanityProducts) {
		if (!sanityProduct.productId) continue

		const product = await db.query.products.findFirst({
			where: eq(products.id, sanityProduct.productId),
		})

		console.log({ sanityProduct })

		if (product) {
			console.log('updating product fields', { product: product.name })
			WRITE_TO_DB &&
				(await db
					.update(products)
					.set({
						fields: {
							// ...product.fields,
							body: sanityProduct.body,
							description: sanityProduct.description,
							slug: sanityProduct.slug,
							state: sanityProduct.state,
							title: sanityProduct.title,
							visibility: 'public',
							...(sanityProduct.image
								? {
										image: {
											url: sanityProduct.image.url,
											alt: sanityProduct.image.alt,
										},
									}
								: {}),
							...(sanityProduct.ogImage
								? {
										ogImage: {
											url: sanityProduct.ogImage,
										},
									}
								: {}),
							welcomeVideo: sanityProduct.welcomeVideo,
							features:
								sanityProduct.features?.map((feature) => ({
									icon: feature.icon,
									value: feature.value,
								})) || [],
						},
					})
					.where(eq(products.id, product.id)))

			let modulePosition = 0
			for (const contentModule of sanityProduct.modules || []) {
				const resource = await courseBuilderAdapter.getContentResource(
					contentModule._id,
				)

				if (resource) {
					const resourceProduct =
						await db.query.contentResourceProduct.findFirst({
							where: and(
								eq(contentResourceProduct.resourceId, resource.id),
								eq(contentResourceProduct.productId, product.id),
							),
						})

					if (!resourceProduct) {
						console.log('associating resource', {
							resource: resource.fields?.title,
						})
						WRITE_TO_DB &&
							(await db.insert(contentResourceProduct).values({
								resourceId: resource.id,
								productId: product.id,
								position: modulePosition,
								metadata: {
									addedBy: '7ee4d72c-d4e8-11ed-afa1-0242ac120002',
								},
							}))
						modulePosition++
					}
				}
			}
			for (const upgradableTo of sanityProduct.upgradableTo || []) {
				const upgradesForProduct = await db.query.upgradableProducts.findMany({
					where: and(eq(upgradableProducts.upgradableFromId, product.id)),
				})

				WRITE_TO_DB &&
					(await db.insert(upgradableProducts).values({
						upgradableToId: upgradableTo.productId,
						upgradableFromId: product.id,
						position: upgradesForProduct.length,
					}))
			}
		}
	}
}
