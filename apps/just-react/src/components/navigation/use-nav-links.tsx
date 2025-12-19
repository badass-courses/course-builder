import * as React from 'react'
import { api } from '@/trpc/react'
import { formatCohortDateRange } from '@/utils/format-cohort-date'
import { formatInTimeZone } from 'date-fns-tz'

import type { NavLinkItem } from './nav-link-item'

export type NavigationMenuData = {
	browse: {
		featured: FeaturedResource | null
		items: ResourceItem[]
	}
}

export type FeaturedResource = {
	slug: string
	type: string
	title: string
	description: string
	badge?: string
	metadata?: string | null
	expires?: Date | null
}

export type ResourceItem = {
	href: string
	title: string
	description: string
}

/**
 * Hook that provides navigation menu data for the main navigation
 */
export function useNavLinks(): NavigationMenuData {
	let featuredProduct: FeaturedResource | null = null
	const { data: defaultCouponData } = api.pricing.defaultCoupon.useQuery()
	const firstProductResource =
		defaultCouponData?.product?.resources?.[0]?.resource

	if (
		defaultCouponData &&
		featuredProduct !== null &&
		firstProductResource?.fields.slug ===
			(featuredProduct as FeaturedResource).slug
	) {
		// TypeScript's control flow analysis incorrectly narrows featuredProduct to never
		// because it's initialized to null and never reassigned before this check.
		// The null check above guarantees it's non-null here.
		const product = featuredProduct as FeaturedResource
		featuredProduct = {
			...product,
			badge: `Save ${defaultCouponData.percentageDiscount * 100}%`,
			expires: defaultCouponData.expires
				? new Date(defaultCouponData.expires)
				: null,
		}
	}

	const browse = {
		featured: featuredProduct,
		items: [
			{
				href: '/browse?type=cohort',
				title: 'Cohort-based Courses',
				description: 'View and enroll in upcoming cohorts',
			},
			{
				href: '/browse?type=workshop',
				title: 'Self-paced Courses',
				description:
					'Learn by building real-world projects with modern stack and AI.',
			},
			{
				href: '/browse',
				title: 'Browse All',
				description: 'View all resources across all categories.',
			},
		],
	}

	return {
		browse,
	}
}
