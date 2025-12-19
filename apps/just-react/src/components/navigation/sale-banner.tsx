import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { SaleBannerData } from '@/lib/sale-banner'
import { ChevronsRight } from 'lucide-react'

import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

const SaleBanner = ({
	saleBannerData,
	isCommerceEnabled,
}: {
	saleBannerData: SaleBannerData | null
	isCommerceEnabled: boolean
}) => {
	const pathname = usePathname()
	if (!saleBannerData || !isCommerceEnabled) return null
	const { productPath } = saleBannerData
	const isProductPage = pathname.includes(saleBannerData?.productPath || '')

	if (isProductPage) return null

	return (
		<Link
			href={productPath}
			className="bg-foreground text-background flex h-8 items-center justify-center text-sm font-medium"
		>
			{getBannerCopy(saleBannerData)}
			<ChevronsRight className="size-4" />
		</Link>
	)
}

export default SaleBanner

/**
 * Generates professional banner copy based on product type and discount information
 */
function getBannerCopy(data: SaleBannerData): string {
	const {
		productType,
		productName,
		discountFormatted,
		discountType,
		discountValue,
	} = data

	switch (productType) {
		case 'self-paced': {
			// Professional copy for self-paced workshops/courses
			if (discountType === 'percentage') {
				return `Limited-Time Offer: Save ${discountFormatted} on ${productName}`
			}
			return `Special Pricing: ${discountFormatted} off ${productName}`
		}
		case 'cohort': {
			// Professional copy for cohort-based programs
			if (discountType === 'percentage') {
				return `Enrollment Open: Save ${discountFormatted} Early-Bird Discount on ${productName}`
			}
			return `Enrollment Open: ${discountFormatted} Early-Bird Discount on ${productName}`
		}
		case 'event': {
			// Professional copy for live events
			if (discountType === 'percentage') {
				return `Register Now: Save ${discountFormatted} on ${productName}`
			}
			return `Register Now: ${discountFormatted} off ${productName}`
		}
		default: {
			// Fallback for unknown product types
			if (discountType === 'percentage') {
				return `Special Offer: Save ${discountFormatted} on ${productName}`
			}
			return `Special Offer: ${discountFormatted} off ${productName}`
		}
	}
}
