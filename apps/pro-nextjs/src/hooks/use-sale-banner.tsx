'use client'

import { useParams } from 'next/navigation'
import { api } from '@/trpc/react'

export default function useSaleBanner() {
	const { data: defaultCoupon, status } = api.pricing.defaultCoupon.useQuery()
	const params = useParams()
	const allowPurchase = defaultCoupon?.product?.fields?.visibility === 'public'
	const isOnProductPage = defaultCoupon?.product?.fields?.slug === params.slug
	const hasExpired = defaultCoupon?.expires
		? new Date(defaultCoupon?.expires) < new Date()
		: false

	if (defaultCoupon && allowPurchase && !hasExpired) {
		return {
			percentageOff: `${Number(defaultCoupon?.percentageDiscount) * 100}`,
			defaultCoupon,
		}
	} else {
		return null
	}
}
