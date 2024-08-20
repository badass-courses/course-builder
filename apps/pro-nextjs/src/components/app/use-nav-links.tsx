import * as React from 'react'
import { api } from '@/trpc/react'

import type { NavLinkItem } from '../navigation/nav-link-item'

export function useNavLinks() {
	// const { data: availableEvents, status } = api.events.get.useQuery()

	return [
		{
			href: '/workshops',
			label: 'Pro Workshops',
		},
		{
			href: '/tutorials',
			label: 'Tutorials',
		},
		{
			href: '/articles',
			label: 'Articles',
		},
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
