import * as React from 'react'
import { api } from '@/trpc/react'

import type { NavLinkItem } from './nav-link-item'

export type CourseItem = {
	href: string
	image: {
		src: string
		alt: string
		width: number
		height: number
	}
	title: string
	description: string
}

export type CohortItem = {
	href: string
	image: {
		src: string
		alt: string
		width: number
		height: number
	}
	title: string
	subtitle: string
}

export type FeaturedTutorial = {
	href: string
	badge: string
	title: string
	description: string
}

export type TutorialItem = {
	href: string
	title: string
	description: string
}

export type NavigationMenuData = {
	courses: CourseItem[]
	cohorts: CohortItem[]
	browseAll: {
		href: string
		label: React.ReactNode | string
	}
	pastCohorts: CohortItem[]
}

/**
 * Hook that provides navigation menu data for the main navigation
 */
export function useNavLinks(): NavigationMenuData {
	const courses: CourseItem[] = [
		{
			href: '/workshops/epic-mcp-from-scratch-to-production',
			image: {
				src: 'https://res.cloudinary.com/epic-web/image/upload/v1764149033/workshops/workshop-bmisp/epic-mcp-thumbnail_2x.jpg',
				alt: 'Epic MCP: Go from Scratch to Production',
				width: 960 / 6,
				height: 540 / 6,
			},
			title: 'Epic MCP: Go from Scratch to Production',
			description: 'The future of AI integration is here.',
		},
	]

	const cohorts: CohortItem[] = []

	const pastCohorts: CohortItem[] = [
		{
			href: '/cohorts/master-mcp',
			image: {
				src: 'https://res.cloudinary.com/epic-web/image/upload/c_limit,w_828/f_auto/q_auto/v1756970053/cohort-thumbnail_2x?_a=BAVAZGAQ0',
				alt: 'Master the Model Context Protocol (MCP)',
				width: 776 / 6,
				height: 507 / 6,
			},
			title: 'Master the Model Context Protocol (MCP)',
			subtitle: 'September, 2025',
		},
	]

	const browseAll = {
		href: '/posts',
		label: (
			<span>
				Browse{' '}
				<span className="inline-block sm:hidden lg:inline-block">all</span>
			</span>
		),
	}

	return {
		courses,
		cohorts,
		browseAll,
		pastCohorts,
	}
}
