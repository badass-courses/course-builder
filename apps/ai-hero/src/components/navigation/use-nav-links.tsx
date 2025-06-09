import * as React from 'react'
import { api } from '@/trpc/react'

import type { NavLinkItem } from './nav-link-item'

export function useNavLinks() {
	// const { data: availableEvents, status } = api.events.get.useQuery()
	// const { data: publishedResourcesLength, status } =
	// 	api.contentResources.getPublishedResourcesLength.useQuery()

	return [
		{
			href: '/cohorts/build-deepsearch-in-typescript',
			label: (
				<span className="relative -mr-2 flex items-center gap-1">
					Course
					<div className="bg-primary text-primary-foreground relative flex h-4 scale-90 items-center justify-center overflow-hidden rounded-full px-1 text-[10px] font-semibold leading-none">
						New
						<div
							style={{
								backgroundSize: '200% 100%',
								animationDuration: '2s',
								animationIterationCount: 'infinite',
								animationTimingFunction: 'linear',
								animationFillMode: 'forwards',
								animationDelay: '2s',
							}}
							className="animate-shine absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0)40%,rgba(255,255,255,1)50%,rgba(255,255,255,0)60%)] opacity-10 dark:opacity-20"
						/>
					</div>
				</span>
			),
		},
		{
			href: '/posts',
			label: 'Posts',
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
