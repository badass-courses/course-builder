import type { SaleBannerData } from '@/lib/sale-banner'
import { ChevronsRight } from 'lucide-react'

const SaleBanner = ({
	saleBannerData,
	isCommerceEnabled,
}: {
	saleBannerData: SaleBannerData | null
	isCommerceEnabled: boolean
}) => {
	if (!saleBannerData || !isCommerceEnabled) return null

	return (
		<div className="">
			New{' '}
			{saleBannerData.productType === 'self-paced'
				? `course ・ Save ${saleBannerData.percentOff}% on ${saleBannerData.productName}`
				: `cohort open ・ Register for the "${saleBannerData.productName}" today and save ${saleBannerData.percentOff}%`}
			<ChevronsRight className="size-4" />
		</div>
	)
}

export default SaleBanner
