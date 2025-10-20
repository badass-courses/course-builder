import Link from 'next/link'
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
	if (!saleBannerData || !isCommerceEnabled) return null
	const { productPath } = saleBannerData

	return (
		<Link
			href={productPath}
			className="bg-foreground text-background flex items-center justify-center py-2"
		>
			New{' '}
			{saleBannerData.productType === 'self-paced'
				? `course ・ Save ${saleBannerData.percentOff}% on ${saleBannerData.productName}`
				: `cohort open ・ Register for the "${saleBannerData.productName}" today and save ${saleBannerData.percentOff}%`}
			<ChevronsRight className="size-4" />
		</Link>
	)
}

export default SaleBanner
