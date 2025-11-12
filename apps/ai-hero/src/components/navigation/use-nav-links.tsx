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
	freeTutorials: {
		featured: FeaturedTutorial
		items: TutorialItem[]
	}
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
			href: '/workshops/ai-sdk-v5-crash-course',
			image: {
				src: 'https://res.cloudinary.com/total-typescript/image/upload/v1758621207/workshops/workshop-xoh13/bkljkijniogppynqfqjc.jpg',
				alt: 'AI SDK v5 Crash Course',
				width: 960 / 6,
				height: 540 / 6,
			},
			title: 'AI SDK v5 Crash Course',
			description:
				"Master AI SDK v5 with AI Hero's comprehensive crash course.",
		},
	]

	const cohorts: CohortItem[] = [
		{
			href: '/cohorts/build-your-own-ai-personal-assistant-in-typescript',
			image: {
				src: 'https://res.cloudinary.com/total-typescript/image/upload/v1762890580/cohorts/cohort-ytorn/dmkvhhpfp5kg9ew5rtef.jpg',
				alt: 'Build Your Own AI Personal Assistant in TypeScript',
				width: 960 / 6,
				height: 540 / 6,
			},
			title: 'Build Your Own AI Personal Assistant in TypeScript',
			subtitle: 'December 8—12, 2025',
		},
	]

	const pastCohorts: CohortItem[] = [
		{
			href: '/cohorts/build-deepsearch-in-typescript',
			image: {
				src: 'https://res.cloudinary.com/total-typescript/image/upload/v1748619829/cohorts/cohort-5uyf5/kttfkqzngqj6uvbpgjhl.jpg',
				alt: 'Build DeepSearch in TypeScript',
				width: 776 / 6,
				height: 507 / 6,
			},
			title: 'Build DeepSearch in TypeScript',
			subtitle: 'July, 2025',
		},
	]

	const freeTutorials = {
		featured: {
			href: '/llm-fundamentals',
			badge: 'New',
			title: 'LLM Fundamentals',
			description:
				"A free tutorial teaching you the fundamentals of LLM's so you can use them better.",
		},
		items: [
			{
				href: '/ai-engineer-roadmap',
				title: 'The AI Engineer Roadmap',
				description:
					"Want to build AI-powered apps, but don't know where to start? You need a roadmap.",
			},
			{
				href: '/vercel-ai-sdk-tutorial',
				title: 'Vercel AI SDK Tutorial',
				description:
					'Learn streaming, structured outputs, tool calls and agents.',
			},
			{
				href: '/model-context-protocol-tutorial',
				title: 'Model Context Protocol Tutorial',
				description:
					'Learn the essentials of the Model Context Protocol in AI.',
			},
		],
	}

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
		freeTutorials,
		browseAll,
		pastCohorts,
	}
}
