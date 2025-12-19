import { headers } from 'next/headers'
import { courseBuilderAdapter } from '@/db'
import { getPricingData } from '@/lib/pricing-query'
import { getProduct } from '@/lib/products-query'
import { getCachedWorkshopProduct } from '@/lib/workshops-query'
import { getServerAuthSession } from '@/server/auth'

import { propsForCommerce } from '@coursebuilder/core/pricing/props-for-commerce'
import { productSchema, type Purchase } from '@coursebuilder/core/schemas'

import { type WorkshopPageProps } from './workshop-page-props'

/**
 * Creates purchase data for workshop pages with all commerce logic.
 * Similar to events' createPurchaseDataLoader but for workshop resources.
 *
 * @param moduleSlug - The workshop module slug
 * @param searchParams - URL search params for commerce overrides
 * @returns Purchase data including pricing loader and commerce props
 */
export async function createWorkshopPurchaseDataLoader(
	moduleSlug: string,
	searchParams: { [key: string]: string | string[] | undefined },
): Promise<WorkshopPageProps & { allowPurchase: boolean }> {
	const token = await getServerAuthSession()
	const user = token?.session?.user

	const workshopProduct = await getCachedWorkshopProduct(moduleSlug)
	const product = await getProduct(workshopProduct?.id)

	let workshopProps: WorkshopPageProps

	if (product) {
		const pricingDataLoader = getPricingData({
			productId: product.id,
		})

		const countryCode =
			(await headers()).get('x-vercel-ip-country') ||
			process.env.DEFAULT_COUNTRY ||
			'US'
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

		const baseProps: WorkshopPageProps = {
			availableBonuses: [],
			product,
			pricingDataLoader,
			quantityAvailable: product.quantityAvailable,
			...commerceProps,
		}

		if (!user) {
			workshopProps = baseProps
		} else {
			const purchaseForProduct = commerceProps.purchases?.find(
				(purchase: Purchase) => {
					return purchase.productId === productSchema.parse(product).id
				},
			)

			if (!purchaseForProduct) {
				workshopProps = baseProps
			} else {
				const { purchase, existingPurchase } =
					await courseBuilderAdapter.getPurchaseDetails(
						purchaseForProduct.id,
						user.id,
					)
				const purchasedProductIds =
					commerceProps?.purchases?.map((purchase) => purchase.productId) || []
				workshopProps = {
					...baseProps,
					hasPurchasedCurrentProduct: Boolean(
						purchase &&
							(purchase.status === 'Valid' || purchase.status === 'Restricted'),
					),
					existingPurchase,
					quantityAvailable: product.quantityAvailable,
					purchasedProductIds,
				}
			}
		}
	} else {
		workshopProps = {
			availableBonuses: [],
			quantityAvailable: -1,
			pricingDataLoader: Promise.resolve({
				formattedPrice: null,
				purchaseToUpgrade: null,
				quantityAvailable: -1,
			}),
		}
	}

	const allowPurchase =
		searchParams?.allowPurchase === 'true' ||
		(workshopProps?.product?.fields.state === 'published' &&
			workshopProps?.product?.fields.visibility === 'public')

	return { ...workshopProps, allowPurchase }
}
