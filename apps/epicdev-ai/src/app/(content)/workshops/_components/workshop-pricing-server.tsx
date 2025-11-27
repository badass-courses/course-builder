import * as React from 'react'
import { headers } from 'next/headers'
import { courseBuilderAdapter } from '@/db'
import { getPricingData } from '@/lib/pricing-query'
import { getProduct } from '@/lib/products-query'
import { getSaleBannerData } from '@/lib/sale-banner'
import {
	getCachedWorkshopProduct,
	getWorkshopProduct,
} from '@/lib/workshops-query'
import { getServerAuthSession } from '@/server/auth'

import { propsForCommerce } from '@coursebuilder/core/pricing/props-for-commerce'
import { productSchema, type Purchase } from '@coursebuilder/core/schemas'

import { type WorkshopPageProps } from './workshop-page-props'

export async function WorkshopPricing({
	searchParams,
	moduleSlug,
	children,
}: {
	searchParams: { [key: string]: string | string[] | undefined }
	moduleSlug: string
	children: (props: WorkshopPageProps) => React.ReactNode
}) {
	const token = await getServerAuthSession()
	const user = token?.session?.user

	const workshopProduct = await getCachedWorkshopProduct(moduleSlug)
	const product = await getProduct(workshopProduct?.id)

	let workshopProps: WorkshopPageProps
	let defaultCoupon: WorkshopPageProps['defaultCoupon'] = null
	let saleData: WorkshopPageProps['saleData'] = null

	if (product) {
		const countryCode =
			(await headers()).get('x-vercel-ip-country') ||
			process.env.DEFAULT_COUNTRY ||
			'US'

		const [commerceProps, couponResult] = await Promise.all([
			propsForCommerce(
				{
					query: {
						// allowPurchase: 'true',
						...searchParams,
					},
					userId: user?.id,
					products: [product],
					countryCode,
				},
				courseBuilderAdapter,
			),
			courseBuilderAdapter.getDefaultCoupon([product.id]),
		])

		const defaultCouponFromAdapter = couponResult?.defaultCoupon ?? null

		// Determine the active merchant coupon for pricing data
		let merchantCouponId: string | undefined
		let usedCouponId: string | undefined

		if (defaultCouponFromAdapter?.merchantCouponId) {
			merchantCouponId = defaultCouponFromAdapter.merchantCouponId
			usedCouponId = defaultCouponFromAdapter.id
		} else if (commerceProps.couponIdFromCoupon) {
			// If there's a coupon from commerce props, get its merchant coupon
			const coupon = await courseBuilderAdapter.couponForIdOrCode({
				couponId: commerceProps.couponIdFromCoupon,
			})
			if (coupon?.merchantCoupon?.id) {
				merchantCouponId = coupon.merchantCoupon.id
				usedCouponId = coupon.id
			}
		} else if (commerceProps.couponFromCode?.merchantCoupon?.id) {
			merchantCouponId = commerceProps.couponFromCode.merchantCoupon.id
			usedCouponId = commerceProps.couponFromCode.id
		}

		// Create pricing data loader with coupon information
		const pricingDataLoader = getPricingData({
			productId: product.id,
			merchantCouponId,
			usedCouponId,
		})

		const baseProps: WorkshopPageProps = {
			availableBonuses: [],
			product,
			pricingDataLoader,
			quantityAvailable: product.quantityAvailable,
			...commerceProps,
		}

		if (defaultCouponFromAdapter) {
			defaultCoupon = defaultCouponFromAdapter
			saleData = await getSaleBannerData(defaultCouponFromAdapter)
		}

		if (!user) {
			workshopProps = { ...baseProps, defaultCoupon, saleData }
		} else {
			const purchaseForProduct = commerceProps.purchases?.find(
				(purchase: Purchase) => {
					return purchase.productId === productSchema.parse(product).id
				},
			)

			if (!purchaseForProduct) {
				workshopProps = { ...baseProps, defaultCoupon, saleData }
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
					defaultCoupon,
					saleData,
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
			defaultCoupon: null,
			saleData: null,
		}
	}

	const ALLOW_PURCHASE =
		searchParams?.allowPurchase === 'true' ||
		(workshopProps?.product?.fields.state === 'published' &&
			workshopProps?.product?.fields.visibility === 'public')

	return <>{children({ ...workshopProps, allowPurchase: ALLOW_PURCHASE })}</>
}
