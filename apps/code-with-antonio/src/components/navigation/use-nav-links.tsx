import * as React from 'react'
import { api } from '@/trpc/react'

import type { NavLinkItem } from './nav-link-item'

export type NavigationMenuData = {
	browse: {
		featured: FeaturedCourse
		items: CourseItem[]
	}
}

export type FeaturedCourse = {
	href: string
	badge: string
	title: string
	description: string
}

export type CourseItem = {
	href: string
	title: string
	description: string
}

/**
 * Hook that provides navigation menu data for the main navigation
 */
export function useNavLinks(): NavigationMenuData {
	const browse = {
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

	return {
		browse,
	}
}
