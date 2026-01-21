import * as React from 'react'
import { api } from '@/trpc/react'
import { formatCohortDateRange } from '@/utils/format-cohort-date'
import { formatInTimeZone } from 'date-fns-tz'

import type { NavLinkItem } from './nav-link-item'

export type NavigationMenuData = {
	browse: {
		featured?: FeaturedResource
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
	image?: string | null
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
		type: 'workshop',
		slug: 'build-and-deploy-a-cursor-clone',
		title: 'Build and Deploy a Cursor Clone',
		description: `You'll learn how to create a professional IDE with a CodeMirror 6 editor featuring syntax highlighting, code folding, and a minimap, integrate AI-powered code suggestions and quick edit functionality using Claude, handle background job execution for AI agents with multi-tool capabilities, and build a full SaaS business layer with authentication and GitHub OAuth.`,
		image:
			'https://res.cloudinary.com/dezn0ffbx/image/upload/v1768309978/workshops/workshop_6lw0i/57a97191-e92c-442d-a56d-218542c56c95-lr3qgo.webp',
		// badge: 'NEW',
		// expires: null,
		// metadata: 'Dec 1—Dec 5, 2025',
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
				href: '/browse?type=workshop',
				title: 'Self-paced Courses',
				description:
					'Learn by building real-world projects with modern stack and AI.',
			},
			// {
			// 	href: '/browse?type=cohort',
			// 	title: 'Cohort-based Courses',
			// 	description: 'View and enroll in upcoming cohorts',
			// },
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
