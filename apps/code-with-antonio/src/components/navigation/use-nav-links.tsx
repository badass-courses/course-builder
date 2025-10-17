import * as React from 'react'
import { api } from '@/trpc/react'
import { formatCohortDateRange } from '@/utils/format-cohort-date'
import { formatInTimeZone } from 'date-fns-tz'

import type { NavLinkItem } from './nav-link-item'

export type NavigationMenuData = {
	browse: {
		featured: FeaturedResource
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
	let featuredProduct: FeaturedResource = {
		type: 'cohort',
		slug: 'ai-powered-applications-with-ai-sdk-and-next-js-mwrd3',
		title: 'Building AI-Powered Applications with React and Next.js',
		description: 'Building AI-Powered Applications with React and Next.js',
		expires: null,
		metadata: 'Dec 1—Dec 5, 2025',
	}
	const { data: defaultCouponData } = api.pricing.defaultCoupon.useQuery()
	const firstProductResource =
		defaultCouponData?.product?.resources?.[0]?.resource

	if (
		defaultCouponData &&
		firstProductResource?.fields.slug === featuredProduct.slug
	) {
		featuredProduct = {
			...featuredProduct,
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
