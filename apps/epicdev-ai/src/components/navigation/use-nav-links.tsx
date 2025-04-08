import * as React from 'react'
import { api } from '@/trpc/react'
import { AcademicCapIcon } from '@heroicons/react/24/outline'
import { Newspaper } from 'lucide-react'

import type { NavLinkItem } from './nav-link-item'

export function useNavLinks() {
	// const { data: availableEvents, status } = api.events.get.useQuery()
	// const { data: publishedResourcesLength, status } =
	// 	api.contentResources.getPublishedResourcesLength.useQuery()

	return [
		{
			href: '/posts',
			label: (
				<>
					<AcademicCapIcon className="text-muted-foreground mr-1 size-5" />
					Learn
				</>
			),

			// label: (
			// 	<span className="relative">
			// 		Posts
			// 		{publishedResourcesLength && publishedResourcesLength > 0 && (
			// 			<div
			// 				className="text-primary absolute -right-3 -top-0.5 flex items-center justify-center rounded-full font-mono text-[8px] font-semibold saturate-50"
			// 				aria-label={`${publishedResourcesLength} scheduled`}
			// 			>
			// 				{publishedResourcesLength}
			// 			</div>
			// 		)}
			// 	</span>
			// ),
		},
		{
			href: '/newsletter',
			label: (
				<>
					<Newspaper className="text-muted-foreground mr-2 size-4" />
					Newsletter
				</>
			),
		},
		// {
		// 	href: '/workshops',
		// 	label: 'Pro Workshops',
		// },
		// {
		// 	href: '/tutorials',
		// 	label: 'Tutorials',
		// },
		// {
		// 	href: '/articles',
		// 	label: 'Articles',
		// },
		// {
		// 	href: '/events',
		// 	label: (
		// 		<>
		// 			Events
		// 			{availableEvents && availableEvents.length > 0 && (
		// 				<div
		// 					className="mb-1 ml-1 h-1 w-1 rounded-full bg-rose-400"
		// 					aria-label={`${availableEvents.length} scheduled`}
		// 				/>
		// 			)}
		// 		</>
		// 	),
		// },
	] as NavLinkItem[]
}
