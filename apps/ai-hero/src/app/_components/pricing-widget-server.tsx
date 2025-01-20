import { headers } from 'next/headers'
import { ProductPricing } from '@/app/(commerce)/products/[slug]/_components/product-pricing'
import { courseBuilderAdapter } from '@/db'
import { getPricingData } from '@/lib/pricing-query'
import { getProduct } from '@/lib/products-query'
import { getServerAuthSession } from '@/server/auth'

import { propsForCommerce } from '@coursebuilder/core/pricing/props-for-commerce'

export async function PricingWidgetServer({
	productId = 'ai-hero-pro-membership-7564c',
}: {
	productId?: string
}) {
	const { session } = await getServerAuthSession()
	const user = session?.user
	const product = await getProduct(productId)

	if (!product) return null

	const pricingDataLoader = getPricingData({ productId: product?.id })
	const headersList = await headers()
	const countryCode =
		headersList.get('x-vercel-ip-country') ||
		process.env.DEFAULT_COUNTRY ||
		'US'

	const commerceProps = await propsForCommerce(
		{
			query: {
				allowPurchase: 'true',
			},
			userId: user?.id,
			products: [product],
			countryCode,
		},
		courseBuilderAdapter,
	)

	const purchaseForProduct = commerceProps.purchases?.find(
		(purchase) => purchase.productId === product.id,
	)

	const baseProps = {
		product,
		quantityAvailable: -1,
		commerceProps,
		pricingDataLoader,
		purchasedProductIds: [],
	}

	let productProps = baseProps

	if (user && purchaseForProduct) {
		const { purchase, existingPurchase } =
			await courseBuilderAdapter.getPurchaseDetails(
				purchaseForProduct.id,
				user.id,
			)

		productProps = {
			...baseProps,
			hasPurchasedCurrentProduct: Boolean(purchase),
			purchasedProductIds: existingPurchase ? [existingPurchase.productId] : [],
		}
	}

	return <ProductPricing {...productProps} />
}
