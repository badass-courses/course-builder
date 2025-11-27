import * as React from 'react'
import { DiscountCountdown } from '@/components/mdx/mdx-components'
import {
	DiscountDeadline,
	HasPurchased,
	PricingInline,
} from '@/components/pricing'
import { EnrollButton } from '@/components/pricing/enroll-button'
import { db } from '@/db'
import { products } from '@/db/schema'
import { compileMDX } from '@/utils/compile-mdx'
import { eq } from 'drizzle-orm'

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@coursebuilder/ui'

import { type WorkshopPageProps } from './workshop-page-props'

/**
 * Server component that compiles workshop MDX body with pricing-aware components
 * This enables dynamic pricing display within workshop description content
 */
export async function WorkshopBodyWithPricing({
	rawBody,
	pricingProps,
}: {
	rawBody: string
	pricingProps: WorkshopPageProps
}) {
	const {
		product,
		hasPurchasedCurrentProduct,
		pricingDataLoader,
		defaultCoupon,
		saleData,
		purchases,
		allowPurchase,
	} = pricingProps

	// Get product slug to ID map for HasPurchased component
	const allProducts = await db.query.products.findMany({
		where: eq(products.status, 1),
	})
	const productMap = new Map(allProducts.map((p) => [p.fields?.slug, p.id]))

	const { content } = await compileMDX(
		rawBody,
		{
			Enroll: ({ children = 'Enroll Now' }: { children?: React.ReactNode }) =>
				product && !hasPurchasedCurrentProduct && allowPurchase ? (
					<EnrollButton
						{...pricingProps}
						product={product}
						pricingDataLoader={pricingDataLoader}
					>
						{children}
					</EnrollButton>
				) : null,
			HasDiscount: ({
				children,
				fallback,
			}: {
				children: React.ReactNode
				fallback?: React.ReactNode
			}) => {
				// Only show discount if there's an active default coupon (site-wide sale)
				const hasDefaultCoupon = saleData || defaultCoupon
				return hasDefaultCoupon ? (
					<>{children}</>
				) : fallback ? (
					<>{fallback}</>
				) : null
			},
			DiscountCountdown: () => {
				return defaultCoupon?.expires ? (
					<DiscountCountdown date={new Date(defaultCoupon?.expires)} />
				) : null
			},
			PricingInline: ({ type }: { type: 'original' | 'discounted' }) => (
				<PricingInline type={type} pricingDataLoader={pricingDataLoader} />
			),
			DiscountDeadline: ({ format }: { format?: 'short' | 'long' }) => (
				<DiscountDeadline
					format={format}
					expires={defaultCoupon?.expires ?? null}
				/>
			),
			Tooltip: ({
				children,
				content,
			}: {
				children: React.ReactNode
				content: React.ReactNode
			}) => (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger className="decoration-foreground/30 underline decoration-wavy">
							{children}
						</TooltipTrigger>
						<TooltipContent side="bottom">{content}</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			),
			HasPurchased: ({
				productSlug,
				productId,
				children,
			}: {
				productSlug?: string
				productId?: string
				children: React.ReactNode
			}) => (
				<HasPurchased
					productSlug={productSlug}
					productId={productId}
					purchases={purchases || []}
					productMap={productMap}
				>
					{children}
				</HasPurchased>
			),
		},
		{
			scope: {
				...(saleData
					? { ...saleData }
					: {
							percentOff: 0,
							discountFormatted: '0%',
							discountType: 'percentage',
							discountValue: 0,
						}),
			},
		},
	)

	return <>{content}</>
}
