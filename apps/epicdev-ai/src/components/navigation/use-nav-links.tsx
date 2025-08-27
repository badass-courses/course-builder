import * as React from 'react'
import { api } from '@/trpc/react'
import { AcademicCapIcon } from '@heroicons/react/24/outline'
import { Calendar, Newspaper } from 'lucide-react'

import type { NavLinkItem } from './nav-link-item'

export function useNavLinks() {
	// const { data: availableEvents, status } = api.events.get.useQuery()
	// const { data: publishedResourcesLength, status } =
	// 	api.contentResources.getPublishedResourcesLength.useQuery()

	return [
		{
			href: '/cohorts/build-real-world-ai-connected-apps-with-the-model-context-protocol',
			label: (
				<>
					Course
					<div
						aria-hidden="true"
						className="bg-primary text-primary-foreground relative ml-1 -rotate-2 rounded px-1 py-0.5 text-xs font-semibold"
					>
						New
					</div>
				</>
			),
		},
		{
			href: '/posts',
			label: 'Posts',
		},
		{
			href: '/mcp-workshops',
			label: 'Live Workshops',
		},
		{
			href: '/newsletter',
			label: 'Newsletter',
		},
	] as NavLinkItem[]
}
